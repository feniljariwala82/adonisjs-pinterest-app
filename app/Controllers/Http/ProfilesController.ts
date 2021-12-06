import Application from '@ioc:Adonis/Core/Application'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Post from 'App/Models/Post'
import User from 'App/Models/User'
import ErrorService from 'App/Services/ErrorService'
import ProfileUpdateValidator from 'App/Validators/ProfileUpdateValidator'
import { cuid } from '@ioc:Adonis/Core/Helpers'

export default class ProfilesController {
  /**
   * @description load all the posts for the user and profile
   */
  public async show({ session, response, view, params }: HttpContextContract) {
    let { email } = params

    try {
      let user = await Post.getAllByUserEmail(email)
      return view.render('profile/index', { user: user.serialize() })
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }
  }

  /**
   * @description open edit profile form
   */
  public async edit({ session, response, view, params }: HttpContextContract) {
    let { id } = params

    try {
      let user = await User.findOrFail(id)
      return view.render('profile/edit', { user: user.serialize() })
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
    let { id } = params

    if (!auth.user || auth.user.id !== parseInt(id)) {
      return response.status(400).json('Not authorized to perform this action')
    }

    // validate data
    let payload: any
    try {
      payload = await request.validate(ProfileUpdateValidator)
    } catch (error) {
      console.log(error.messages.errors)
      // errors made by form validator
      let errorMessages = ErrorService.filterMessages(error)
      return response.status(400).json(errorMessages ? errorMessages : error)
    }

    // moving file to the uploads folder
    let imgName: string = ''
    if (payload.avatarUrl) {
      await payload.avatarUrl.move(Application.tmpPath('uploads'), {
        // renaming the file
        name: cuid() + '.' + payload.avatarUrl.extname,
      })
      imgName = payload.avatarUrl.fileName
    }

    // updating user data
    try {
      let result = await User.update(id, payload, imgName)
      return response.status(200).json(result)
    } catch (error) {
      return response.status(400).json(error)
    }
  }
}
