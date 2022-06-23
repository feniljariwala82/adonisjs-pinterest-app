import Drive from '@ioc:Adonis/Core/Drive'
import Database from '@ioc:Adonis/Lucid/Database'
import Hash from '@ioc:Adonis/Core/Hash'
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
  @hasOne(() => Profile, { foreignKey: 'userId', localKey: 'id' })
  public profile: HasOne<typeof Profile>

  /**
   * @description Get all user's post
   * @param id id of the user
   * @returns Promise
   */
  public static getAll = async (id: number) => {
    try {
      const results = await this.query().where('id', id).preload('posts').first()
      return Promise.resolve(results)
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
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
    try {
      const exists = await this.findBy('email', user.email)
      if (exists) return Promise.reject('User already exists')
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }

    // creating user
    let createdUser: any[] = []
    try {
      createdUser = await trx
        .insertQuery()
        .table('users')
        .insert({ email: user.email, password: await Hash.make(user.password.trim()) })

      // committing transaction
      await trx.commit()
    } catch (error) {
      // rollback whole transaction
      await trx.rollback()

      console.error(error)
      return Promise.reject(error.message)
    }

    // creating profile
    try {
      await Profile.updateOrCreateProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        userId: createdUser[0],
      })

      return Promise.resolve('User created')
    } catch (error) {
      // rollback whole transaction
      await trx.rollback()

      console.error(error)
      return Promise.reject(error)
    }
  }

  /**
   * @description method to create user with social auth provider
   * @param email query string email
   * @param profile profile data
   * @returns Promise
   */
  public static createSocialAuthUser = async (email: string, profile: StoreProfileType) => {
    /**
     * 1. fetching whether user exists or not
     * 2. checking if user exists with different auth or not
     */
    let user: User | null
    try {
      user = await this.query().where('email', email).first()
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }

    if (user) {
      // if user exists then checking social auth
      await user.load('profile')

      /**
       * if user already exists with different social auth, then
       * throwing error
       */
      if (user.profile.socialAuth !== profile.socialAuth) {
        const error = 'User already exists with this email'
        console.error(error)
        return Promise.reject(error)
      }
    } else {
      // if does not exists then creating new one
      try {
        user = await this.create({ email })
      } catch (error) {
        console.error(error)
        return Promise.reject(error.message)
      }

      // creating profile
      try {
        await Profile.updateOrCreateProfile({
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatarUrl: profile.avatarUrl ? profile.avatarUrl : undefined,
          socialAuth: profile.socialAuth,
          userId: user.id,
        })
      } catch (error) {
        console.error(error)
        return Promise.reject(error.message)
      }
    }

    return Promise.resolve(user)
  }

  /**
   * @description the method to update the user profile
   * @param data
   * @param updateData
   * @returns Promise
   */
  public static update = async (
    data: { id: number; imageUrl?: string; imageName?: string },
    updateData: UpdateUser
  ) => {
    const { id, imageName, imageUrl } = data
    const { firstName, lastName, password } = updateData

    // checking whether the user exists or not
    let user: User
    try {
      user = await User.query().where('id', id).preload('profile').firstOrFail()
    } catch (error) {
      console.error(error)
      return Promise.reject('User not found')
    }

    /**
     * Removing an old image if a new image provided
     */
    if (imageUrl && user.profile.avatarUrl && user.profile.socialAuth === 'local' && imageName) {
      try {
        await Drive.delete(imageName)
      } catch (error) {
        console.error(error)
        return Promise.reject(error.message)
      }
    }

    // saving user data
    try {
      // for password
      if (password) {
        user.password = await Hash.make(password.trim())
      }

      await user.save()
    } catch (error) {
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
      if (imageUrl) {
        profile.avatarUrl = imageUrl
      }

      try {
        await profile.save()
      } catch (error) {
        console.error(error)
        return Promise.reject(error.message)
      }
    } catch (error) {
      console.error(error)
      return Promise.reject(error)
    }

    return Promise.resolve('User updated')
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
