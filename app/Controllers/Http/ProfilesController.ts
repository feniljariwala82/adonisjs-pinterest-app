import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Post from 'App/Models/Post'

export default class ProfilesController {
  /**
   * @description load all the posts for the user and profile
   */
  public async index({ auth, session, response, view }: HttpContextContract) {
    if (!auth.user) {
      session.flash({ error: 'Please login to continue' })
      return response.redirect().back()
    }

    try {
      let posts = await Post.getAllByUser(auth.user.id)
      return view.render('profile/index', { posts })
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }
  }
}
