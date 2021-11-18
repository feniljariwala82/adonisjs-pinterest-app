import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Tag extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  /**
   * @description method to find posts according to tags
   * @param tags tags
   * @returns Promise
   */
  public static async getPostsForTag(tags: string) {
    try {
      let posts = await this.query()
        .distinct()
        .select('posts.*')
        .from('posts')
        .join('post_tags', 'posts.id', '=', 'post_tags.id')
        .join('tags', 'post_tags.tag_id', '=', 'tags.id')
        .where('tags.title', 'LIKE', '%' + tags + '%')
      return Promise.resolve(posts)
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }
  }
}
