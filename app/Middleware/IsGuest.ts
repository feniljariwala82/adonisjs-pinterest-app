import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class IsGuest {
  public async handle({ auth, response, session }: HttpContextContract, next: () => Promise<void>) {
    // code for middleware goes here. ABOVE THE NEXT CALL
    if (await auth.use('web').check()) {
      session.flash({ warning: 'Not accessible' })
      return response.redirect().toRoute('home')
    }

    await next()
  }
}
