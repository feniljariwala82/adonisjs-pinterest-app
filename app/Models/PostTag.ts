import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Post from 'App/Models/Post'
import Tag from 'App/Models/Tag'

export default class PostTag extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public tag_id: number

  @column()
  public post_id: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // post tag belongs to posts
  @belongsTo(() => Post, {
    localKey: 'id', // primary key in parent table
    foreignKey: 'post_id', // foreign key in this table
  })
  public post: BelongsTo<typeof Post>

  // post tag belongs to posts
  @belongsTo(() => Tag, {
    localKey: 'id', // primary key in parent table
    foreignKey: 'tag_id', // foreign key in this table
  })
  public tag: BelongsTo<typeof Tag>
}
