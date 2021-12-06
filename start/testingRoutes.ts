import Drive from '@ioc:Adonis/Core/Drive'
import Route from '@ioc:Adonis/Core/Route'
import path from 'path'

Route.get('demo', async ({ response }) => {
  let str = path.join('uploads', '2', 'ckwuysamg0003001o3e2b8644.jpg')
  console.log(str, str.split(''))
  response.status(200).json('ok')
  // await Drive.delete(path.join('2', 'ckwuysamg0003001o3e2b8644.jpg'))
})
