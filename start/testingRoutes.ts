import Drive from '@ioc:Adonis/Core/Drive'
import Route from '@ioc:Adonis/Core/Route'
import path from 'path'
import User from 'App/Models/User'

Route.get('demo', async ({ response }) => {
  let str = path.join('uploads', '2', 'ckwuysamg0003001o3e2b8644.jpg')
  console.log(str, str.split(''))
  response.status(200).json('ok')
  // await Drive.delete(path.join('2', 'ckwuysamg0003001o3e2b8644.jpg'))
})

Route.get('user', async ({ response }) => {
  const user = {
    email: 'feniljariwala82@gmail.com',
    firstName: 'fenil',
    lastName: 'jariwala',
    password: '12345678',
  }
  try {
    await User.createUser(user)
    return response.ok('Yes')
  } catch (error) {
    return response.badRequest(error)
  }
})
