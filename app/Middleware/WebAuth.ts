import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class WebAuth {
  public async handle({ auth, response, session }: HttpContextContract, next: () => Promise<void>) {
    // code for middleware goes here. ABOVE THE NEXT CALL
    if (!auth.isAuthenticated) {
      session.flash({ error: 'Unauthorized' })
      return response.redirect().toRoute('auth.login')
    }

    await next()
  }
}
