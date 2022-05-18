import Application from '@ioc:Adonis/Core/Application'
import Hash from '@ioc:Adonis/Core/Hash'
import { BaseModel, beforeSave, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import Post from 'App/Models/Post'
import fs from 'fs'
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
  email?: string
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

  @column()
  public first_name: string

  @column()
  public last_name: string

  @column()
  public full_name: string

  @column()
  public avatar_name: string

  @column()
  public avatar_url: string

  @column()
  public social_auth: string

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
    user.first_name = user.first_name.toLocaleLowerCase().trim()
    user.last_name = user.last_name.toLocaleLowerCase().trim()
    user.email = user.email.toLocaleLowerCase().trim()
    user.full_name =
      user.first_name.toLocaleLowerCase().trim() + ' ' + user.last_name.toLocaleLowerCase().trim()
  }

  // user has many posts
  @hasMany(() => Post, {
    foreignKey: 'user_id', // defaults to userId
  })
  public posts: HasMany<typeof Post>

  /**
   * @description Get all user's post
   * @param id id of the user
   * @returns Promise
   */
  public static async getAll(id: number) {
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
  public static async createUser(user: CreateUser) {
    // checking if user exists or not
    try {
      const exists = await this.findBy('email', user.email)
      if (exists) return Promise.reject('User already exists')
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }

    // creating user
    try {
      await this.create({
        email: user.email,
        password: await Hash.make(user.password.trim()),
        first_name: user.firstName,
        last_name: user.lastName,
      })
      return Promise.resolve('User created')
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }
  }

  /**
   * @description the method to update the user profile
   * @param id id of the user profile
   * @param updateData new data
   * @returns Promise
   */
  public static async update(id: number, updateData: UpdateUser, imageName?: string) {
    const { firstName, lastName, email, password } = updateData

    // checking whether the user exists or not
    let user: User
    try {
      user = await User.findOrFail(id)
    } catch (error) {
      console.error(error)
      return Promise.reject('User not found')
    }

    /**
     * Removing old image if new image provided
     */
    if (imageName && user.avatar_url) {
      fs.unlink(Application.tmpPath(path.join('/uploads/' + user.avatar_url)), (error) => {
        if (error) {
          console.error(error)
          return Promise.reject(error.message)
        }
      })
    }

    // updating the user data
    user.first_name = firstName ? firstName : user.first_name
    user.last_name = lastName ? lastName : user.last_name
    user.email = email ? email : user.email
    user.avatar_url = imageName ? imageName : user.avatar_url

    // for password
    if (password) {
      user.password = await Hash.make(password.trim())
    }

    // saving user data
    try {
      await user.save()
      return Promise.resolve('User updated')
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }
  }
}
