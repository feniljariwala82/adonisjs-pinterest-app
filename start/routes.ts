import Route from '@ioc:Adonis/Core/Route'
import './testingRoutes'

Route.where(
  'email',
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
)

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

Route.group(() => {
  Route.get('/profile/:email', 'ProfilesController.index').as('index')
  Route.get('/profile/:id/edit', 'ProfilesController.edit').as('edit')
  Route.put('/profile/:id', 'ProfilesController.update').as('update')
})
  .middleware(['silentAuth'])
  .as('profile')
