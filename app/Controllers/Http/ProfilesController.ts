import Drive from '@ioc:Adonis/Core/Drive'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
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
