/*
|--------------------------------------------------------------------------
| Validating Environment Variables
|--------------------------------------------------------------------------
|
| In this file we define the rules for validating environment variables.
| By performing validation we ensure that your application is running in
| a stable environment with correct configuration values.
|
| This file is read automatically by the framework during the boot lifecycle
| and hence do not rename or move this file to a different location.
|
*/

import Env from '@ioc:Adonis/Core/Env'

export default Env.rules({
  HOST: Env.schema.string({ format: 'host' }),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  APP_NAME: Env.schema.string(),
  CACHE_VIEWS: Env.schema.boolean(),
  SESSION_DRIVER: Env.schema.string(),
  DRIVE_DISK: Env.schema.enum(['local', 's3'] as const),
  NODE_ENV: Env.schema.enum(['development', 'production', 'testing'] as const),
  DB_CONNECTION: Env.schema.string(),

  // google ally
  GOOGLE_CLIENT_ID: Env.schema.string(),
  GOOGLE_CLIENT_SECRET: Env.schema.string(),

  // github ally
  GITHUB_CLIENT_ID: Env.schema.string(),
  GITHUB_CLIENT_SECRET: Env.schema.string(),

  // facebook ally
  FACEBOOK_CLIENT_ID: Env.schema.string(),
  FACEBOOK_CLIENT_SECRET: Env.schema.string(),

  // AWS
  S3_KEY: Env.schema.string(),
  S3_SECRET: Env.schema.string(),
  S3_BUCKET: Env.schema.string(),
  S3_REGION: Env.schema.string(),
  S3_ENDPOINT: Env.schema.string.optional(),
})
