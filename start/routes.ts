import Route from '@ioc:Adonis/Core/Route'

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
  destroy: 'auth',
  edit: 'auth',
  store: 'auth',
  index: 'auth',
  update: 'auth',
})
