import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
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
    const tagIds: number[] = []
    for (const tagTitle of tags) {
      // checking tagTitle exists or not
      let exists: Tag | null
      try {
        exists = await this.findBy('title', tagTitle)
      } catch (error) {
        console.error(error)
        return Promise.reject(error.message)
      }

      // if exists ignore, if does not exists then add new one
      if (exists) {
        // if tagTitle exists then adding id to the id array, for mapping post to this tagTitle
        tagIds.push(exists.id)
      } else {
        // create new tagTitle and adding id for mapping the post to this tagTitle
        try {
          const createdTag = await this.create({
            title: tagTitle,
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

  public static getAllByTagTitle = async (tags: string[]) => {
    const fetchedTags = await this.query().whereIn('title', tags)
    return fetchedTags
  }
}
