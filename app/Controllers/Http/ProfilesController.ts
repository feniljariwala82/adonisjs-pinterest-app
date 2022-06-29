import Env from '@ioc:Adonis/Core/Env'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Profile from 'App/Models/Profile'
import User from 'App/Models/User'
import ProfileUpdateValidator from 'App/Validators/ProfileUpdateValidator'
import path from 'path'

export default class ProfilesController {
  /**
   * @description load all the posts for the user and profile
   */
  public async show({ session, response, view, params }: HttpContextContract) {
    const { id } = params

    try {
      const profile = await Profile.getProfileById(id)
      const html = await view.render('profile/show', { profile })
      return html
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().toRoute('post.index')
    }
  }

  /**
   * @description open edit profile form
   */
  public async edit({ session, response, view, params, bouncer }: HttpContextContract) {
    const { id } = params

    try {
      const profile = await Profile.getProfileById(id)

      // authorizing
      try {
        await bouncer.with('ProfilePolicy').authorize('update', profile)
      } catch (error) {
        console.error(error)
        session.flash({ error: error.message })
        return response.redirect().toRoute('post.index')
      }

      const html = await view.render('profile/edit', { profile })
      return html
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }
  }

  /**
   * @description update profile form
   */
  public async update({ response, request, params, auth, bouncer, session }: HttpContextContract) {
    const { id } = params

    // validate data
    const payload = await request.validate(ProfileUpdateValidator)

    // finding profile
    let profile: Profile
    try {
      profile = await Profile.getProfileById(parseInt(id))
    } catch (error) {
      session.flash({ error })
      return response.redirect().back()
    }

    // authorizing
    try {
      await bouncer.with('ProfilePolicy').authorize('update', profile)
    } catch (error) {
      console.error(error)
      session.flash({ error: error.message })
      return response.redirect().toRoute('post.index')
    }

    // storage prefix
    let storagePrefix: string = ''

    // new image name
    let imgName: string = ''

    // if new image is uploaded
    if (payload.postImage) {
      imgName = `${cuid()}.${payload.postImage.extname}`

      // new storage prefix
      storagePrefix = path.posix.join(auth.user!.id.toString(), imgName)
    }

    // transaction
    const trx = await Database.transaction()

    // updating user data
    try {
      const result = await User.update({ id, storagePrefix }, payload, trx)

      /**
       * adding new image file to the uploads folder
       */
      if (payload.postImage) {
        try {
          await payload.postImage.moveToDisk(
            auth.user!.id.toString(),
            { name: imgName },
            Env.get('DRIVE_DISK')
          )
        } catch (error) {
          // roll back the whole transaction
          await trx.rollback()

          console.error(error)
          session.flash({ error: error.message })
          return response.redirect().toRoute('post.index')
        }
      }

      // if password is entered then redirecting user to logout
      if (payload.password) {
        session.flash({ success: 'Logging out' })
        return response.redirect().toRoute('auth.logout')
      } else {
        session.flash({ success: result })
        return response.redirect().toRoute('profile.show', { id })
      }
    } catch (error) {
      session.flash({ error })
      return response.redirect().toRoute('profile.show', { id })
    }
  }
}
