import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import User from 'App/Models/User'
import { DateTime } from 'luxon'

type ProfileStoreType = {
  firstName: string
  lastName: string
  userId: number
}

export default class Profile extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public first_name: string

  @column()
  public last_name: string

  @column()
  public profile_image: string

  @column()
  public user_id: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // profile belongs to the user
  @belongsTo(() => User, {
    localKey: 'id', // primary key in parent table
    foreignKey: 'user_id', // foreign key in this table
  })
  public user: BelongsTo<typeof User>

  /**
   * @description method to create new profile
   * @param profile profile to be created
   * @returns Promise
   */
  public static async store(profile: ProfileStoreType) {
    try {
      await this.create({
        first_name: profile.firstName,
        last_name: profile.lastName,
        user_id: profile.userId,
      })
      return Promise.resolve('Profile created')
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }
  }
}
