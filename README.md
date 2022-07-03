# About This Repository

## Pinterest Clone Using AdonisJs

## Requirement

1. git bash terminal(optional)
2. For cloning you must need git installed on your computer
3. Nodejs must be installed
4. MySql database system

## Installation

```bash
git clone https://github.com/feniljariwala82/adonisjs-pinterest-app.git
```

## Start Application

```bash
cd adonisjs-pinterest-app
yarn install
yarn dev
```

## Build Application

```bash
yarn build
cd build
yarn install --production
node server.js
```

## Making it your own

1. Replace "name" field in the package.json file with your project name
2. Close your code editor and rename the folder with your project name
3. Go nuts!

## Why you should use this boilerplate?

1. The main reason of using this boilerplate project is that it comes pre configured with bootstrap-5 and adonisjs
2. And also you can write your customization code inside app.scss located in resources/scss/app.scss
3. To learn more about Adonisjs framework click [here](https://adonisjs.com/)
4. To learn more about Bootstrap customization click [here](https://getbootstrap.com/docs/5.0/customize/overview/)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
Please make sure to update tests as appropriate.

## SQL Error Solve Query

set global sql_mode = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
