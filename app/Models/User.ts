import Hash from '@ioc:Adonis/Core/Hash'
import { BaseModel, beforeSave, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import Post from 'App/Models/Post'
import { DateTime } from 'luxon'

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
  avatarUrl?: any
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
  public avatar_url: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // hashing password
  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }

  // before saving lower casing all names
  @beforeSave()
  public static async lowerCaseData(user: User) {
    user.first_name = user.first_name.toLocaleLowerCase().trim()
    user.last_name = user.last_name.toLocaleLowerCase().trim()
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
    try {
      await this.create({
        email: user.email.toLocaleLowerCase().trim(),
        password: user.password.trim(),
        first_name: user.firstName.toLocaleLowerCase().trim(),
        last_name: user.lastName.toLocaleLowerCase().trim(),
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
  public static async update(id: number, updateData: UpdateUser) {
    const { firstName, lastName, email, password, avatarUrl } = updateData

    // checking whether the user exists or not
    let user: User
    try {
      user = await User.findOrFail(id)
    } catch (error) {
      console.error(error)
      return Promise.reject('User not found')
    }

    // updating the user data
    user.first_name = firstName ? firstName : user.first_name
    user.last_name = lastName ? lastName : user.last_name
    user.email = email ? email : user.email
    user.password = password ? password : user.password
    user.avatar_url = avatarUrl ? avatarUrl : user.avatar_url
    try {
      await user.save()
      return Promise.resolve('User updated')
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }
  }
}
