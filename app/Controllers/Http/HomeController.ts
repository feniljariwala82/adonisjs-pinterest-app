import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Post from 'App/Models/Post'

export default class HomeController {
  /**
   * @description home page of the application
   */
  public index = async ({ view, session, request, response }: HttpContextContract) => {
    const { search } = request.all()

    try {
      const posts = await Post.query()
        .where('title', 'like', `%${search}%`)
        .orWhere('description', 'like', `%${search}%`)

      const html = await view.render('welcome', { posts })
      return html
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }
  }
}
