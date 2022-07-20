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
        .if(typeof search === 'string' || search instanceof String, (queryBuilder) => {
          queryBuilder.where('title', 'like', `%${search}%`)
          queryBuilder.orWhere('description', 'like', `%${search}%`)
        })
        .orderBy('created_at', 'desc')
        .select('*')

      const html = await view.render('welcome', { posts })
      return html
    } catch (error) {
      console.error(error)
      session.flash({ error: error.message })
      return response.redirect().back()
    }
  }
}
