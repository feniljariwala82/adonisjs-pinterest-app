import { TransactionClientContract } from '@ioc:Adonis/Lucid/Database'
import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Post from 'App/Models/Post'
import Tag from 'App/Models/Tag'
import { DateTime } from 'luxon'

export default class TagPost extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public post_id: number

  @column()
  public tag_id: number

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

  /**
   * @description the method to create PostTag pivot data
   * @param postId post id
   * @param tagIds array of tag ids
   * @returns Promise
   */
  public static async storePostTag(
    postId: number,
    tagIds: Array<number>,
    trx: TransactionClientContract
  ) {
    for (const tagId of tagIds) {
      // checking whether the tag exist or not
      const exists = await this.query({ client: trx })
        .where('post_id', postId)
        .andWhere('tag_id', tagId)
        .first()
      if (exists) {
        continue
      }

      /**
       * if post tag does not exist then creating one
       */
      await this.create(
        {
          post_id: postId,
          tag_id: tagId,
        },
        { client: trx }
      )
    }

    return 'Post tags created'
  }

  /**
   * @description finds relative posts for individual post
   * @param tagIds tag_id array
   * @param postId post_id
   * @returns Promise
   */
  public static findRelativePosts = async (tagIds: number[], postId: number) => {
    const tagPosts = await this.query()
      .whereIn('tag_id', tagIds)
      .andWhereNot('post_id', postId)
      .preload('post')
    return tagPosts
  }
}
