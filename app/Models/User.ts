import Drive from '@ioc:Adonis/Core/Drive'
import Hash from '@ioc:Adonis/Core/Hash'
import Database, { TransactionClientContract } from '@ioc:Adonis/Lucid/Database'
import {
  BaseModel,
  beforeSave,
  column,
  hasMany,
  HasMany,
  hasOne,
  HasOne,
} from '@ioc:Adonis/Lucid/Orm'
import Post from 'App/Models/Post'
import Profile from 'App/Models/Profile'
import { DateTime } from 'luxon'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public email: string

  @column({ serializeAs: null })
  public password: string

  @column()
  public rememberMeToken?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // hashing password
  // @beforeSave()
  // public static async hashPassword(user: User) {
  //   if (user.$dirty.password) {
  //     user.password = await Hash.make(user.password.trim())
  //   }
  // }

  // before saving lower casing all column values
  @beforeSave()
  public static async beforeSave(user: User) {
    user.email = user.email.toLocaleLowerCase()
  }

  // user has many posts
  @hasMany(() => Post, {
    foreignKey: 'user_id', // defaults to userId
  })
  public posts: HasMany<typeof Post>

  // user has one profile
  @hasOne(() => Profile, { localKey: 'id', foreignKey: 'userId' })
  public profile: HasOne<typeof Profile>

  /**
   * @description Get all user's post
   * @param id id of the user
   * @returns Promise
   */
  public static getAll = async (id: number) => {
    try {
      const results = await this.query().where('id', id).preload('posts').first()
      return results
    } catch (error) {
      console.error(error)
      throw new Error(error.message)
    }
  }

  /**
   * @description method to create new user
   * @param user User data
   * @returns Promise
   */
  public static createUser = async (user: CreateUser) => {
    // Transaction created
    const trx = await Database.transaction()

    // checking if user exists or not
    const exists = await this.findBy('email', user.email)
    if (exists) {
      throw new Error('User already exists')
    }

    // creating user
    let createdUser: User
    try {
      createdUser = await this.create(
        {
          email: user.email,
          password: await Hash.make(user.password.trim()),
        },
        { client: trx }
      )
    } catch (error) {
      console.error(error)
      // rollback whole transaction
      await trx.rollback()
      throw error
    }

    // creating profile
    try {
      await Profile.updateOrCreateProfile(
        {
          firstName: user.firstName,
          lastName: user.lastName,
          userId: createdUser.id,
        },
        trx
      )
    } catch (error) {
      console.error(error)
      // rollback whole transaction
      await trx.rollback()
      throw error
    }

    // committing transaction
    await trx.commit()

    return createdUser
  }

  /**
   * @description method to create user with social auth provider
   * @param email query string email
   * @param profile profile data
   * @returns Promise
   */
  public static createSocialAuthUser = async (email: string, profile: StoreProfileType) => {
    // Transaction created
    const trx = await Database.transaction()

    /**
     * 1. fetching whether user exists or not
     * 2. checking if user exists with different auth or not
     */
    let user = await this.query().where('email', email).preload('profile').first()

    if (user) {
      /**
       * if user already exists with different social auth, then
       * throwing error
       */
      if (user.profile.socialAuth !== profile.socialAuth) {
        const error = 'User already exists with this email'
        console.error(error)
        throw new Error(error)
      }
    } else {
      /**
       * if does not exists then creating new one
       */
      try {
        // creating user
        user = await this.create({ email }, { client: trx })

        // creating profile
        await Profile.updateOrCreateProfile(
          {
            firstName: profile.firstName,
            lastName: profile.lastName,
            avatarUrl: profile.avatarUrl && profile.avatarUrl,
            socialAuth: profile.socialAuth,
            userId: user.id,
          },
          trx
        )

        // committing transaction
        await trx.commit()
      } catch (error) {
        console.error(error)
        // roll back
        await trx.rollback()
        throw error
      }
    }

    return user
  }

  /**
   * @description the method to update the user profile
   * @param data
   * @param updateData
   * @returns Promise
   */
  public static update = async (
    data: { id: number; storagePrefix?: string },
    updateData: UpdateUser,
    trx: TransactionClientContract
  ) => {
    const { id, storagePrefix } = data
    const { firstName, lastName, password } = updateData

    // checking whether the user exists or not
    let user: User
    try {
      user = await User.query().where('id', id).preload('profile').firstOrFail()
    } catch (error) {
      console.error(error)
      return Promise.reject('User not found')
    }

    // for password
    if (password) {
      user.password = await Hash.make(password.trim())
    }

    // saving user data
    try {
      await user.useTransaction(trx).save()
    } catch (error) {
      // if user saving fails
      await trx.rollback()

      console.error(error)
      return Promise.reject(error.message)
    }

    // updating profile
    try {
      const profile = await Profile.getProfileById(user.profile.id)

      if (firstName) {
        profile.firstName = firstName
      }
      if (lastName) {
        profile.lastName = lastName
      }
      if (storagePrefix) {
        profile.storagePrefix = storagePrefix
      }

      try {
        await profile.useTransaction(trx).save()
      } catch (error) {
        // if profile saving fails
        await trx.rollback()

        console.error(error)
        return Promise.reject(error.message)
      }
    } catch (error) {
      // if finding profile fails
      await trx.rollback()

      console.error(error)
      return Promise.reject(error)
    }

    /**
     * Removing an old image if a new image provided
     */
    if (user.profile.storagePrefix && storagePrefix) {
      try {
        await Drive.delete(user.profile.storagePrefix)
      } catch (error) {
        // if profile get fails
        await trx.rollback()

        console.error(error)
        return Promise.reject(error.message)
      }
    }

    // at the end committing the transaction
    await trx.commit()

    return Promise.resolve('Profile updated')
  }

  public static getUserById = async (id: number) => {
    try {
      const user = await this.query()
        .where('id', id)
        .preload('profile')
        .preload('posts', (postQuery) => {
          postQuery.orderBy('created_at', 'desc')
        })
        .firstOrFail()
      return Promise.resolve(user)
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }
  }
}
