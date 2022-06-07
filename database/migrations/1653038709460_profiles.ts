import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import constants from 'Config/constants'

const { GITHUB, GOOGLE, FACEBOOK } = constants.allyType

export default class Profiles extends BaseSchema {
  protected tableName = 'profiles'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('first_name', 50).notNullable()
      table.string('last_name', 50).notNullable()
      table.string('full_name', 180).notNullable()
      table.string('avatar_name').nullable()
      table.string('avatar_url').nullable()
      table.enum('social_auth', [GITHUB, GOOGLE, FACEBOOK]).nullable().defaultTo(null)
      table.integer('user_id').unsigned().references('users.id').notNullable().onDelete('CASCADE')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
