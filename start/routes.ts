import Route from '@ioc:Adonis/Core/Route'
import './testingRoutes'

Route.where(
  'email',
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
)

// Authentication routes
Route.group(() => {
  /**
   * allow these routes only if the user is not logged in
   */
  Route.group(() => {
    Route.route('/login', ['GET', 'POST'], 'AuthController.login').as('login')
    Route.route('/signup', ['GET', 'POST'], 'AuthController.signup').as('signup')

    // google social auth
    Route.get('/google/redirect', 'AuthController.googleRedirect').as('google.redirect')
    Route.get('/google/callback', 'AuthController.googleCallback').as('google.callback')

    // github social auth
    Route.get('/github/redirect', 'AuthController.githubRedirect').as('github.redirect')
    Route.get('/github/callback', 'AuthController.githubCallback').as('github.callback')

    // facebook social auth
    Route.get('/fb/redirect', 'AuthController.fbRedirect').as('fb.redirect')
    Route.get('/fb/callback', 'AuthController.fbCallback').as('fb.callback')
  }).middleware('isGuest')

  /**
   * allow this route only if the user is logged in
   */
  Route.get('/logout', 'AuthController.logout').as('logout').middleware(['auth'])
})
  .prefix('/auth')
  .as('auth')

// home page
Route.get('/', 'HomeController.index').as('home')

// posts routes
Route.resource('/post', 'PostsController').middleware({
  create: 'auth',
  store: 'auth',
  index: 'auth',
  edit: 'auth',
  update: 'auth',
  destroy: 'auth',
  // no middleware for show route to make it available to all the users
})

Route.resource('/profile', 'ProfilesController').only(['show', 'edit', 'update']).middleware({
  edit: 'auth',
  update: 'auth',
})

// Route.group(() => {
//   Route.get('/profile/:email', 'ProfilesController.show').as('show').middleware(['silentAuth'])
//   Route.get('/profile/:id/edit', 'ProfilesController.edit').as('edit').middleware(['auth'])
//   Route.put('/profile/:id', 'ProfilesController.update').as('update').middleware(['auth'])
// }).as('profile')
