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

  // google social auth
  Route.get('/google/redirect', 'AuthController.googleRedirect').as('google.redirect')
  Route.get('/google/callback', 'AuthController.googleCallback').as('google.callback')

  // github social auth
  Route.get('/github/redirect', 'AuthController.githubRedirect').as('github.redirect')
  Route.get('/github/callback', 'AuthController.githubCallback').as('github.callback')

  // facebook social auth
  Route.get('/fb/redirect', 'AuthController.fbRedirect').as('fb.redirect')
  Route.get('/fb/callback', 'AuthController.fbCallback').as('fb.callback')
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
  Route.get('/profile/:email', 'ProfilesController.show').as('index').middleware(['silentAuth'])
  Route.get('/profile/:id/edit', 'ProfilesController.edit').as('edit').middleware(['auth'])
  Route.put('/profile/:id', 'ProfilesController.update').as('update').middleware(['auth'])
}).as('profile')
