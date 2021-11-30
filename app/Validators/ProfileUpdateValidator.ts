import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema, validator } from '@ioc:Adonis/Core/Validator'

export default class ProfileUpdateValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = validator.reporters.api

  public schema = schema.create({
    firstName: schema.string.optional({ trim: true }, [rules.alpha()]),
    lastName: schema.string.optional({ trim: true }, [rules.alpha()]),
    email: schema.string.optional({ trim: true }, [rules.email()]),
    password: schema.string.optional({ trim: true }, [rules.minLength(8)]),
    avatarUrl: schema.file.optional({
      size: '2mb',
      extnames: ['jpg', 'png'],
    }),
  })

  public messages = {
    'firstName.alpha': 'The first name must contain alphabets only',
    'lastName.alpha': 'The last name must contain alphabets only',
    'email.email': 'Please provide valid email',
    'password.minLength': 'Password must be 8 characters long',
  }
}
