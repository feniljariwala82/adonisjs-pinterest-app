import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class IsGuest {
  public async handle({ auth, response, session }: HttpContextContract, next: () => Promise<void>) {
    // code for middleware goes here. ABOVE THE NEXT CALL
    if (auth.use('web').isAuthenticated) {
      session.flash({ warning: 'Already Logged In' })
      return response.redirect().toRoute('home')
    }

    await next()
  }
}
