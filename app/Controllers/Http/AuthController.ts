import Hash from '@ioc:Adonis/Core/Hash'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'
import User from 'App/Models/User'
import constants from 'Config/constants'

const { GITHUB, GOOGLE, FACEBOOK } = constants.allyType
const { passwordRegex } = constants.regex

export default class AuthController {
  /**
   * Login method
   */
  public async login({ request, response, session, auth, view }: HttpContextContract) {
    switch (request.method()) {
      case 'POST':
        const postSchema = schema.create({
          email: schema.string({ trim: true }, [rules.required(), rules.email()]),
          password: schema.string({ trim: true }, [rules.required(), rules.minLength(8)]),
        })

        // validating data
        const payload = await request.validate({
          schema: postSchema,
          messages: {
            'required': 'The {{ field }} is required',
            'email.email': 'Email should be a valid email id',
            'password.minLength': 'Password must be 8 characters long',
          },
        })

        // fetching user
        let user: User
        try {
          user = await User.findByOrFail('email', payload.email.toLocaleLowerCase())
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
          console.error(error)
          session.flash({ error: error.message })
          return response.redirect().back()
        }

      default:
        const html = await view.render('auth/login')
        return html
    }
  }

  /**
   * Sign up method
   */
  public async signup({ request, response, session, view, auth }: HttpContextContract) {
    switch (request.method()) {
      case 'POST':
        const postSchema = schema.create({
          firstName: schema.string({ trim: true }, [rules.required(), rules.alpha()]),
          lastName: schema.string({ trim: true }, [rules.required(), rules.alpha()]),
          email: schema.string({ trim: true }, [rules.required(), rules.email()]),
          password: schema.string({ trim: true }, [
            rules.required(),
            rules.minLength(8),
            rules.regex(passwordRegex),
          ]),
        })

        // validating data
        const payload = await request.validate({
          schema: postSchema,
          messages: {
            'required': 'The {{ field }} is required',
            'firstName.alpha': 'The first name must contain alphabets only',
            'lastName.alpha': 'The last name must contain alphabets only',
            'email.email': 'Please provide valid email',
            'password.minLength': 'Password must be 8 characters long',
            'password.regex':
              'Password must be 8 characters long, with one uppercase, lowercase, number and special character',
          },
        })

        // creating new user
        try {
          const createdUser = await User.createUser(payload)

          // login attempt
          try {
            await auth.use('web').login(createdUser)
            session.flash({ success: 'Account created, and you are logged in' })
            return response.redirect().toRoute('home')
          } catch (error) {
            console.error(error)
            session.flash({ error: error.message })
            return response.redirect().back()
          }
        } catch (error) {
          session.flash({ error })
          return response.redirect().back()
        }

      default:
        const html = await view.render('auth/signup')
        return html
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

  /**
   * @description redirect to google login page
   */
  public async googleRedirect({ ally }: HttpContextContract) {
    return ally.use('google').redirect()
  }

  /**
   * @description callback route
   */
  public async googleCallback({ ally, session, response, auth }: HttpContextContract) {
    const google = ally.use('google')

    /**
     * User has explicitly denied the login request
     */
    if (google.accessDenied()) {
      session.flash({ error: 'Access was denied' })
      return response.redirect().toRoute('auth.login')
    }

    /**
     * Unable to verify the CSRF state
     */
    if (google.stateMisMatch()) {
      session.flash({ error: 'Request expired. Retry again' })
      return response.redirect().toRoute('auth.login')
    }

    /**
     * There was an unknown error during the redirect
     */
    if (google.hasError()) {
      session.flash({ error: 'Redirection error' })
      return response.redirect().toRoute('auth.login')
    }

    /**
     * Finally, access the user
     */
    try {
      const authUser = await google.user()

      // creating or validating user
      let user: User
      try {
        user = await User.createSocialAuthUser(authUser.email!, {
          firstName: authUser.original.given_name,
          lastName: authUser.original.family_name,
          avatarUrl: authUser.avatarUrl ? authUser.avatarUrl : undefined,
          socialAuth: GOOGLE,
        })
      } catch (error) {
        console.error(error)
        session.flash({ error })
        return response.redirect().toRoute('auth.login')
      }

      /**
       * Login user using the web guard
       */
      try {
        await auth.use('web').login(user)
        session.flash({ success: 'Logged In' })
        return response.redirect().toRoute('post.index')
      } catch (error) {
        session.flash({ error: error.message })
        return response.redirect().toRoute('auth.login')
      }
    } catch (error) {
      session.flash({ error: error.message })
      return response.redirect().toRoute('auth.login')
    }
  }

  /**
   * @description redirect to google login page
   */
  public async githubRedirect({ ally }: HttpContextContract) {
    return ally.use('github').redirect()
  }

  /**
   * @description callback route
   */
  public async githubCallback({ ally, session, response, auth }: HttpContextContract) {
    let github: any
    try {
      github = ally.use('github')
    } catch (error) {
      console.log(error)
    }

    /**
     * User has explicitly denied the login request
     */
    if (github.accessDenied()) {
      session.flash({ error: 'Access was denied' })
      return response.redirect().toRoute('auth.login')
    }

    /**
     * Unable to verify the CSRF state
     */
    if (github.stateMisMatch()) {
      session.flash({ error: 'Request expired. Retry again' })
      return response.redirect().toRoute('auth.login')
    }

    /**
     * There was an unknown error during the redirect
     */
    if (github.hasError()) {
      session.flash({ error: 'Redirection error' })
      return response.redirect().toRoute('auth.login')
    }

    /**
     * Finally, access the user
     */
    try {
      const authUser = await github.user()

      // creating or validating user
      let user: User
      try {
        user = await User.createSocialAuthUser(authUser.email!, {
          firstName: authUser.name.split(' ')[0],
          lastName: authUser.name.split(' ')[1],
          avatarUrl: authUser.avatarUrl ? authUser.avatarUrl : undefined,
          socialAuth: GITHUB,
        })
      } catch (error) {
        session.flash({ error })
        return response.redirect().toRoute('auth.login')
      }

      /**
       * Login user using the web guard
       */
      await auth.use('web').login(user)

      session.flash({ success: 'Logged In' })
      return response.redirect().toRoute('post.index')
    } catch (error) {
      console.log(error)
      session.flash({ error: error.message })
      return response.redirect().toRoute('auth.login')
    }
  }

  /**
   * @description redirect to google login page
   */
  public async fbRedirect({ ally }: HttpContextContract) {
    return ally.use('facebook').redirect()
  }

  /**
   * @description callback route
   */
  public async fbCallback({ ally, session, response, auth }: HttpContextContract) {
    let faceBook = ally.use('facebook')

    /**
     * User has explicitly denied the login request
     */
    if (faceBook.accessDenied()) {
      session.flash({ error: 'Access was denied' })
      return response.redirect().toRoute('auth.login')
    }

    /**
     * Unable to verify the CSRF state
     */
    if (faceBook.stateMisMatch()) {
      session.flash({ error: 'Request expired. Retry again' })
      return response.redirect().toRoute('auth.login')
    }

    /**
     * There was an unknown error during the redirect
     */
    if (faceBook.hasError()) {
      session.flash({ error: 'Redirection error' })
      return response.redirect().toRoute('auth.login')
    }

    /**
     * Finally, access the user
     */
    try {
      const authUser = await faceBook.user()

      // creating or validating user
      let user: User
      try {
        user = await User.createSocialAuthUser(authUser.email!, {
          firstName: authUser.name.split(' ')[0],
          lastName: authUser.name.split(' ')[1],
          avatarUrl: authUser.avatarUrl ? authUser.avatarUrl : undefined,
          socialAuth: FACEBOOK,
        })
      } catch (error) {
        session.flash({ error })
        return response.redirect().toRoute('auth.login')
      }

      /**
       * Login user using the web guard
       */
      await auth.use('web').login(user)

      session.flash({ success: 'Logged In' })
      return response.redirect().toRoute('post.index')
    } catch (error) {
      console.log(error)
      session.flash({ error: error.message })
      return response.redirect().toRoute('auth.login')
    }
  }
}
