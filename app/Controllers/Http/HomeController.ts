import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Post from 'App/Models/Post'

export default class HomeController {
  /**
   * @description home page of the application
   */
  public async index({ view, session, response }: HttpContextContract) {
    try {
      let posts = await Post.getAll()
      return view.render('welcome', { posts: posts.map((post) => post.serialize()) })
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }
  }
}
