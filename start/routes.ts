import Route from '@ioc:Adonis/Core/Route'
import './testingRoutes'

// Authentication routes
Route.group(() => {
  Route.route('/login', ['GET', 'POST'], 'AuthController.login').as('login').middleware('isGuest')
  Route.route('/signup', ['GET', 'POST'], 'AuthController.signup')
    .as('signup')
    .middleware('isGuest')
  Route.get('/logout', 'AuthController.logout').as('logout').middleware(['auth'])
})
  .prefix('/auth')
  .as('auth')

// home page
Route.get('/', 'HomeController.index').as('home').middleware(['silentAuth'])

// posts routes
Route.resource('/post', 'PostsController').middleware({
  create: 'auth',
  store: 'auth',
  index: 'auth',
  show: 'silentAuth',
  edit: 'auth',
  update: 'auth',
  destroy: 'auth',
})

// Route for profile
Route.resource('/profile', 'ProfilesController').middleware({ '*': ['silentAuth'] })
