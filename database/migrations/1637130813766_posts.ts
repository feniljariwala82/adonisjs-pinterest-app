import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Posts extends BaseSchema {
  protected tableName = 'posts'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('title', 50).notNullable()
      table.string('description', 400).notNullable()
      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE').notNullable()
      table.string('storage_prefix').notNullable()
      table.string('image_url').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
