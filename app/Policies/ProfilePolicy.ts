import { BasePolicy } from '@ioc:Adonis/Addons/Bouncer'
import User from 'App/Models/User'
import Profile from 'App/Models/Profile'

export default class ProfilePolicy extends BasePolicy {
  public async edit(user: User, profile: Profile) {
    return user.id === profile.userId
  }
  public async update(user: User, profile: Profile) {
    return user.id === profile.userId
  }
}
