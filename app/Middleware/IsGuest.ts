import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class IsGuest {
  public async handle({ auth, response }: HttpContextContract, next: () => Promise<void>) {
    // code for middleware goes here. ABOVE THE NEXT CALL
    if (await auth.use('web').check()) {
      return response.redirect().toRoute('post.index')
    }

    await next()
  }
}
