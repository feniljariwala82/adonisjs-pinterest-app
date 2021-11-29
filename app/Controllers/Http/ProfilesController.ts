import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Post from 'App/Models/Post'

export default class ProfilesController {
  /**
   * @description load all the posts for the user and profile
   */
  public async index({ session, response, view, params }: HttpContextContract) {
    let { email } = params

    try {
      let user = await Post.getAllByUserEmail(email)
      return view.render('profile/index', { user })
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
      let user = await Post.getAllByUser(id)
      return view.render('profile/edit', { user })
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }
  }

  /**
   * @description update profile form
   */
  public async update({ session, response, view, params }: HttpContextContract) {
    let { id } = params

    try {
      let user = await Post.getAllByUser(id)
      // return view.render('profile/index', { user })
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }
  }
}
