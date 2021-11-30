import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'
import Hash from '@ioc:Adonis/Core/Hash'

export default class AuthController {
  /**
   * Login method
   */
  public async login({ request, response, session, auth, view }: HttpContextContract) {
    switch (request.method()) {
      case 'POST':
        let postSchema = schema.create({
          email: schema.string({ trim: true }, [rules.required(), rules.email()]),
          password: schema.string({ trim: true }, [rules.required(), rules.minLength(8)]),
        })

        // validating data
        let payload = await request.validate({
          schema: postSchema,
          messages: {
            'required': 'The {{ field }} is required',
            'password.minLength': 'Password must be 8 characters long',
          },
        })

        // fetching user
        let user: User
        try {
          user = await User.findByOrFail('email', payload.email.toLocaleLowerCase().trim())
        } catch (error) {
          console.error(error)
          session.flash({ error: 'User not found' })
          return response.redirect().back()
        }

        // Verify password
        if (!(await Hash.verify(user.password, payload.password))) {
          session.flash({ error: 'Invalid credentials' })
          return response.redirect().back()
        }

        // login attempt
        try {
          await auth.use('web').login(user)
          session.flash({ success: 'Logged in' })
          return response.redirect().toRoute('home')
        } catch (error) {
          console.error(error.message)
          session.flash({ error: error.message })
          return response.redirect().back()
        }

      default:
        return view.render('auth/login')
    }
  }

  /**
   * Sign up method
   */
  public async signup({ request, response, session, view }: HttpContextContract) {
    switch (request.method()) {
      case 'POST':
        let postSchema = schema.create({
          firstName: schema.string({ trim: true }, [rules.required(), rules.alpha()]),
          lastName: schema.string({ trim: true }, [rules.required(), rules.alpha()]),
          email: schema.string({ trim: true }, [rules.required(), rules.email()]),
          password: schema.string({ trim: true }, [rules.required(), rules.minLength(8)]),
        })

        // validating data
        let payload = await request.validate({
          schema: postSchema,
          messages: {
            'required': 'The {{ field }} is required',
            'firstName.alpha': 'The first name must contain alphabets only',
            'lastName.alpha': 'The last name must contain alphabets only',
            'email.email': 'Please provide valid email',
            'password.minLength': 'Password must be 8 characters long',
          },
        })

        // creating new user
        try {
          let result = await User.createUser(payload)
          session.flash({ success: result })
          return response.redirect().toRoute('home')
        } catch (error) {
          session.flash({ error })
          return response.redirect().back()
        }

      default:
        return view.render('auth/signup')
    }
  }

  /**
   * Logout method
   */
  public async logout({ auth, session, response }: HttpContextContract) {
    try {
      await auth.use('web').logout()
      session.flash({ success: 'Logged out' })
      return response.redirect().toRoute('home')
    } catch (error) {
      session.flash({ error })
      return response.redirect().back()
    }
  }
}
