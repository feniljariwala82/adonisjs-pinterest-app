import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Post from 'App/Models/Post'

export default class HomeController {
  /**
   * @description home page of the application
   */
  public async index({ view, session, response }: HttpContextContract) {
    let posts: Post[] = []
    try {
      posts = await Post.getAll()
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }

    return view.render('welcome', { posts })
  }
}
