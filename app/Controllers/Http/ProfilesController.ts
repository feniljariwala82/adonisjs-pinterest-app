import Drive from '@ioc:Adonis/Core/Drive'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Profile from 'App/Models/Profile'
import User from 'App/Models/User'
import ErrorService from 'App/Services/ErrorService'
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
  public async update({ response, request, params, auth, bouncer }: HttpContextContract) {
    const { id } = params

    const profile = await Profile.getProfileById(id)

    // authorizing
    try {
      await bouncer.with('ProfilePolicy').authorize('update', profile)
    } catch (error) {
      console.error(error)
      return response.unauthorized(error.message)
    }

    // validate data
    try {
      const payload = await request.validate(ProfileUpdateValidator)

      // image url
      let url: string = ''
      let fileName: string = ''

      if (payload.avatarUrl) {
        // new image name
        const imageName = `${cuid()}.${payload.avatarUrl.extname}`

        // path at which profile image should be moved
        const userDirPath = auth.user!.id.toString()

        await payload.avatarUrl.moveToDisk(
          userDirPath,
          {
            // renaming the file
            name: imageName,
          },
          'local'
        )

        // updating payload avatar url path
        try {
          fileName = path.join(userDirPath, imageName)
          url = await Drive.getUrl(fileName)
        } catch (error) {
          console.error(error)
          return response.status(400).json(error.message)
        }
      }

      // updating user data
      try {
        const result = await User.update({ id, imageUrl: url, imageName: fileName }, payload)
        return response.status(200).json(result)
      } catch (error) {
        return response.status(400).json(error)
      }
    } catch (error) {
      // errors made by form validator
      const errorMessages = ErrorService.filterMessages(error)
      return response.status(400).json(errorMessages ? errorMessages : error)
    }
  }
}
