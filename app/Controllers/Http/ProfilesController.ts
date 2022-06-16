import Application from '@ioc:Adonis/Core/Application'
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
      const user = await User.getUserById(id)
      const html = await view.render('profile/show', { user })
      return html
    } catch (error) {
      session.flash({ error })
      return response.redirect().back()
    }
  }

  /**
   * @description open edit profile form
   */
  public async edit({ session, response, view, params }: HttpContextContract) {
    const { id } = params

    try {
      const user = await User.getUserById(id)
      const html = await view.render('profile/edit', { user })
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
  public async update({ response, request, params, auth }: HttpContextContract) {
    const { id } = params

    // validate data
    try {
      const payload = await request.validate(ProfileUpdateValidator)

      // image url
      let imageUrl: string = ''

      if (payload.avatarUrl) {
        // new image name
        const imageName = cuid() + '.' + payload.avatarUrl.extname

        // path at which profile image should be moved
        const uploadPath = path.join(Application.tmpPath('uploads'), auth.user!.id.toString())

        await payload.avatarUrl.move(uploadPath, {
          // renaming the file
          name: imageName,
        })

        // updating payload avatar url path
        imageUrl = path.join(uploadPath, imageName)
      }

      // updating user data
      try {
        const result = await User.update(id, payload, imageUrl)
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
