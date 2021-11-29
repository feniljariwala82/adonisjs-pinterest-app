import { schema, rules, validator } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class UpdatePostValidator {
  constructor(protected ctx: HttpContextContract) {}

  public reporter = validator.reporters.api

  public schema = schema.create({
    title: schema.string({ trim: true }, [rules.required(), rules.maxLength(50)]),
    description: schema.string({ trim: true }, [rules.required(), rules.maxLength(400)]),
    postImage: schema.file({
      size: '2mb',
      extnames: ['jpg', 'png'],
    }),
    tags: schema.array([rules.minLength(1)]).members(schema.string()),
  })

  public messages = {
    'required': 'The {{ field }} is required',
    'title.maxLength': 'Title can not be longer than 50 characters',
    'description.maxLength': 'Description can not be longer than 400 characters',
    'postImage.required': 'The Image is required',
    'postImage.size': 'Image size should not be greater than 2mb',
    'postImage.extnames': 'Image should be jpg or png only',
    'tags.minLength': 'At least one tag should be entered',
    'tags.alpha': 'Tags can contain alphabets only',
  }
}
