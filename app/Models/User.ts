import Application from '@ioc:Adonis/Core/Application'
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
import fs from 'fs'
import { unlink } from 'fs/promises'
import { DateTime } from 'luxon'
import path from 'path'

type CreateUser = {
  firstName: string
  lastName: string
  email: string
  password: string
}

type UpdateUser = {
  firstName?: string
  lastName?: string
  password?: string
}

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
    // checking if user exists or not
    try {
      const exists = await this.findBy('email', user.email)
      if (exists) return Promise.reject('User already exists')
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }

    // creating user
    let createdUser: User
    try {
      createdUser = await this.create({
        email: user.email,
        password: await Hash.make(user.password.trim()),
      })
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }

    // creating profile
    try {
      await Profile.updateOrCreateProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        userId: createdUser.id,
      })
      return Promise.resolve('User created')
    } catch (error) {
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
   * @param id id of the user profile
   * @param updateData new data
   * @returns Promise
   */
  public static update = async (id: number, updateData: UpdateUser, imageUrl?: string) => {
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
    if (imageUrl && user.profile.avatarUrl && user.profile.socialAuth === 'local') {
      try {
        await unlink(user.profile.avatarUrl)
      } catch (error) {
        console.error(error)
        return Promise.reject(error.message)
      }
    }

    // for password
    if (password) {
      user.password = await Hash.make(password.trim())
    }

    // saving user data
    try {
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
        .preload('posts')
        .firstOrFail()
      return Promise.resolve(user)
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }
  }
}
