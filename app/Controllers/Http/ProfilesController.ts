import Drive from '@ioc:Adonis/Core/Drive'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
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
      return response.redirect().back()
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
      profile = await Profile.getProfileById(id)
    } catch (error) {
      console.error(error)
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
    // if new image is uploaded
    if (payload.postImage) {
      const imgName = `${cuid()}.${payload.postImage.extname}`

      /**
       * adding new image file to the uploads folder
       */
      try {
        await payload.postImage.moveToDisk(auth.user!.id.toString(), { name: imgName }, 'local')
      } catch (error) {
        console.error(error)
        session.flash({ error: error.message })
        return response.redirect().toRoute('post.index')
      }

      // new storage prefix
      storagePrefix = path.join(auth.user!.id.toString(), imgName)
    }

    // updating user data
    try {
      const result = await User.update({ id, storagePrefix }, payload)

      // if password is entered then redirecting user to logout
      if (payload.password) {
        session.flash({ success: 'Logging out' })
        return response.redirect().toRoute('auth.logout')
      } else {
        session.flash({ success: result })
        return response.redirect().toRoute('profile.show', { id })
      }
    } catch (error) {
      // on error removing the image that we shifted to storage
      if (storagePrefix) {
        try {
          await Drive.delete(storagePrefix)
        } catch (error) {
          console.error(error)
          session.flash({ error: error.message })
          return response.redirect().toRoute('profile.show', { id })
        }
      }

      session.flash({ error })
      return response.redirect().toRoute('profile.show', { id })
    }
  }
}
