import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'
import constants from 'Config/constants'

const { passwordRegex } = constants.regex

export default class ProfileUpdateValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    firstName: schema.string.optional({ trim: true }, [rules.alpha()]),
    lastName: schema.string.optional({ trim: true }, [rules.alpha()]),
    password: schema.string.optional({ trim: true }, [
      rules.minLength(8),
      rules.regex(passwordRegex),
    ]),
    postImage: schema.file.optional({
      size: '2mb',
      extnames: ['jpg', 'png'],
    }),
  })

  public messages = {
    'firstName.alpha': 'The first name must contain alphabets only',
    'lastName.alpha': 'The last name must contain alphabets only',
    'password.minLength': 'Password must be 8 characters long',
    'password.regex':
      'Password must be 8 characters long, with one uppercase, lowercase, number and special character',
  }
}
