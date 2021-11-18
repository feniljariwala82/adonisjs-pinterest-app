import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreatePostValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    title: schema.string({ trim: true }, [rules.required(), rules.maxLength(50)]),
    description: schema.string({ trim: true }, [rules.required(), rules.maxLength(400)]),
    post_image: schema.file({
      size: '2mb',
      extnames: ['jpg', 'png'],
    }),
  })

  public messages = {
    'required': 'The {{ field }} is required',
    'title.maxLength': 'Title can not be longer than 50 characters',
    'description.maxLength': 'Description can not be longer than 400 characters',
  }
}
