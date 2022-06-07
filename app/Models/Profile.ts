import { BaseModel, beforeSave, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import User from 'App/Models/User'
import { DateTime } from 'luxon'

interface StoreProfileType {
  firstName: string
  lastName: string
  userId: number
}

export default class Profile extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public firstName: string

  @column()
  public lastName: string

  @column()
  public fullName: string

  @column()
  public avatarName: string

  @column()
  public avatarUrl: string

  @column()
  public socialAuth: string

  @column()
  public userId: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static beforeSave = async (profile: Profile) => {
    profile.firstName = profile.firstName.toLocaleLowerCase()
    profile.lastName = profile.lastName.toLocaleLowerCase()
    profile.fullName =
      profile.firstName.toLocaleLowerCase() + ' ' + profile.lastName.toLocaleLowerCase()
  }

  @belongsTo(() => User, { localKey: 'id', foreignKey: 'userId' })
  public user: BelongsTo<typeof User>

  /**
   * @description stores profile into profile table
   * @param data profile data
   * @returns Promise
   */
  public static storeProfile = async (data: StoreProfileType) => {
    try {
      await this.create({
        firstName: data.firstName,
        lastName: data.lastName,
        userId: data.userId,
      })
      return Promise.resolve('Profile created')
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }
  }

  /**
   * @description get profile by its id
   * @param profileId id of profile
   * @returns Promise
   */
  public static getProfile = async (profileId: number) => {
    try {
      const profile = await this.query().where('id', profileId).preload('user').firstOrFail()
      profile.user.load('posts')
      return Promise.resolve(profile)
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }
  }
}
