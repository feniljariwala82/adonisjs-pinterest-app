import Drive from '@ioc:Adonis/Core/Drive'
import {
  afterFetch,
  afterFind,
  BaseModel,
  beforeSave,
  belongsTo,
  BelongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm'
import User from 'App/Models/User'
import { DateTime } from 'luxon'

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
  public storagePrefix: string

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

  @afterFind()
  public static async afterFindHook(profile: Profile) {
    if (profile.storagePrefix) {
      profile.$extras.imageBaseString = (await Drive.get(profile.storagePrefix)).toString('base64')
    }
  }

  @afterFetch()
  public static async afterFetchHook(profiles: Profile[]) {
    for (const profile of profiles) {
      if (profile.storagePrefix) {
        profile.$extras.imageBaseString = (await Drive.get(profile.storagePrefix)).toString(
          'base64'
        )
      }
    }
  }

  /**
   * @description stores profile into profile table
   * @param data profile data
   * @returns Promise
   */
  public static updateOrCreateProfile = async (data: StoreProfileType) => {
    let queryString = {}
    // @ts-ignore
    if (typeof parseInt(data.userId) === 'number') {
      queryString = { userId: data.userId }
    } else {
      queryString = { userId: null }
    }

    try {
      await this.updateOrCreate(queryString, {
        firstName: data.firstName,
        lastName: data.lastName,
        userId: data.userId,
        avatarUrl: data.avatarUrl && data.avatarUrl,
        socialAuth: data.socialAuth && data.socialAuth,
        storagePrefix: data.storagePrefix && data.storagePrefix,
      })
      return Promise.resolve('Profile saved')
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }
  }

  public static getProfileById = async (id: number) => {
    try {
      const profile = await this.query()
        .where('id', id)
        .preload('user', (userQuery) => {
          userQuery.preload('posts')
        })
        .firstOrFail()

      return Promise.resolve(profile)
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }
  }
}
