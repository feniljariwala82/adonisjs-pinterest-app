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

type CreateUser = {
  firstName: string
  lastName: string
  email: string
  password: string
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

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }

  // user has many posts
  @hasMany(() => Post, {
    foreignKey: 'user_id', // defaults to userId
  })
  public posts: HasMany<typeof Post>

  // user has one profile
  @hasOne(() => Profile, { foreignKey: 'user_id' })
  public profile: HasOne<typeof Profile>

  /**
   * @description Get all user's post
   * @param id id of the user
   * @returns Promise
   */
  public static async getAll(id: number) {
    try {
      let results = await this.query().where('id', id).preload('posts').first()
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
  public static async createUser(user: CreateUser) {
    // checking if user exists or not
    try {
      let exists = await this.findBy('email', user.email)
      if (exists) return Promise.reject('User already exists')
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }

    // creating user
    let createdUser: User
    try {
      createdUser = await this.create({
        email: user.email.toLocaleLowerCase().trim(),
        password: user.password.trim(),
      })
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }

    // creating profile
    try {
      await Profile.store({
        firstName: user.firstName.trim(),
        lastName: user.lastName.trim(),
        userId: createdUser.id,
      })
      return Promise.resolve('User created')
    } catch (error) {
      console.error(error)
      return Promise.reject(error)
    }
  }
}
