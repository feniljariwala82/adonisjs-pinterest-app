import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

let data = [
  {
    title: 'Image1',
    src: 1 + '.jpg',
  },
  {
    title: 'Image2',
    src: 2 + '.jpg',
  },
  {
    title: 'Image3',
    src: 3 + '.jpg',
  },
  {
    title: 'Image4',
    src: 4 + '.jpg',
  },
  {
    title: 'Image6',
    src: 1 + '.jpg',
  },
  {
    title: 'Image7',
    src: 4 + '.jpg',
  },
  {
    title: 'Image8',
    src: 3 + '.jpg',
  },
  {
    title: 'Image9',
    src: 2 + '.jpg',
  },
  {
    title: 'Image10',
    src: 4 + '.jpg',
  },
  {
    title: 'Image11',
    src: 3 + '.jpg',
  },
]

export default class HomeController {
  /**
   * @description home page of the application
   */
  public async index({ view, auth }: HttpContextContract) {
    return view.render('welcome', { data, auth })
  }
}
