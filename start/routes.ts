import Route from '@ioc:Adonis/Core/Route'

// Authentication routes
Route.group(() => {
  Route.route('/login', ['GET', 'POST'], 'AuthController.login').as('login')
  Route.route('/signup', ['GET', 'POST'], 'AuthController.signup').as('signup')
  Route.get('/logout', 'AuthController.logout').as('logout').middleware(['auth'])
})
  .prefix('/auth')
  .as('auth')

// home page
Route.get('/', 'HomeController.index').as('home')

// posts routes
Route.resource('/post', 'PostsController').middleware({ '*': ['auth'] })
