import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import TagPost from 'App/Models/TagPost'
import { DateTime } from 'luxon'

export default class Tag extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // post has many tags
  @hasMany(() => TagPost, {
    foreignKey: 'tag_id',
  })
  public postTags: HasMany<typeof TagPost>

  /**
   * @description method to find posts according to tags
   * @param tags tags
   * @returns Promise
   */
  public static async getPostsForTag(tags: string) {
    try {
      const posts = await this.query()
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

  /**
   * @description the method to create tags
   * @param tags tags to be added
   * @returns Promise
   */
  public static async storeTag(tags: Array<string>) {
    const tagIds: Array<number> = []
    for (const tag of tags) {
      // checking tag exists or not
      let exists: Tag | null
      try {
        exists = await this.findBy('title', tag)
      } catch (error) {
        console.error(error)
        return Promise.reject(error.message)
      }

      // if exists ignore, if does not exists then add new one
      if (exists) {
        // if tag exists then adding id to the id array, for mapping post to this tag
        tagIds.push(exists.id)
      } else {
        // create new tag and adding id for mapping the post to this tag
        try {
          const createdTag = await this.create({
            title: tag.toLowerCase(),
          })
          tagIds.push(createdTag.id)
        } catch (error) {
          console.error(error)
          return Promise.reject(error.message)
        }
      }
    }

    return Promise.resolve(tagIds)
  }
}
