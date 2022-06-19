import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class TagPosts extends BaseSchema {
  protected tableName = 'tag_posts'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('post_id').unsigned().references('posts.id').onDelete('CASCADE').notNullable()
      table.integer('tag_id').unsigned().references('tags.id').onDelete('CASCADE').notNullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
