import Route from '@ioc:Adonis/Core/Route'
import Application from '@ioc:Adonis/Core/Application'
import path from 'path'

Route.get('demo', ({ response }) => {
  return response
    .status(200)
    .json(Application.tmpPath(path.join('uploads', 'ckwdsy31b00024s1o8kn01qic.jpg')))
})
