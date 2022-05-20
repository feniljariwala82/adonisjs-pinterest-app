import { BaseModel, column, beforeSave } from '@ioc:Adonis/Lucid/Orm'
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
  public static async beforeSave(profile: Profile) {
    profile.firstName = profile.firstName.toLocaleLowerCase().trim()
    profile.lastName = profile.lastName.toLocaleLowerCase().trim()
    profile.fullName =
      profile.firstName.toLocaleLowerCase().trim() +
      ' ' +
      profile.lastName.toLocaleLowerCase().trim()
  }

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
}
