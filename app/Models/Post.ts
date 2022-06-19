import {
  BaseModel,
  beforeSave,
  BelongsTo,
  belongsTo,
  column,
  manyToMany,
  ManyToMany,
} from '@ioc:Adonis/Lucid/Orm'
import Tag from 'App/Models/Tag'
import TagPost from 'App/Models/TagPost'
import User from 'App/Models/User'
import { DateTime } from 'luxon'

export default class Post extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public title: string

  @column()
  public description: string

  @column()
  public user_id: number

  @column()
  public storage_prefix: string

  @column()
  public image_url: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // defining relationship
  @belongsTo(() => User, {
    localKey: 'id', // primary key in parent table
    foreignKey: 'user_id', // foreign key in this table
  })
  public user: BelongsTo<typeof User>

  @manyToMany(() => Tag, {
    // table name
    pivotTable: 'tag_posts',
    // foreign keys
    localKey: 'id',
    pivotForeignKey: 'post_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'tag_id',
  })
  public tags: ManyToMany<typeof Tag>

  @beforeSave()
  public static async beforeSave(post: Post) {
    post.title = post.title.toLowerCase()
    post.description = post.description.toLowerCase()
  }

  /**
   * @description method to get all the posts
   * @returns Promise
   */
  public static async getAll() {
    try {
      const posts = await this.query().preload('user').preload('tags').orderBy('created_at', 'desc')
      return Promise.resolve(posts)
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }
  }

  /**
   * @description method to find all the posts for particular user
   * @param userId user id
   * @returns Promise
   */
  public static async getAllByUserId(userId: number) {
    try {
      const user = await User.query()
        .where('id', userId)
        .preload('posts', (postQuery) => {
          postQuery.orderBy('created_at', 'desc')
        })
        .first()
      return Promise.resolve(user)
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }
  }

  /**
   * @description the method to create new post
   * @returns Promise
   */
  public static async storePost(data: StorePostType) {
    // creating post
    let post: Post
    try {
      post = await this.create({
        title: data.title.toLocaleLowerCase(),
        description: data.description.toLocaleLowerCase(),
        user_id: data.id,
        image_url: data.imgUrl,
        storage_prefix: data.storagePrefix,
      })
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }

    // creating tags
    let tagIds: Array<number>
    try {
      // Non-null assertion operator
      tagIds = await Tag.storeTag(data.tags)
    } catch (error) {
      console.error(error)
      return Promise.reject(error)
    }

    // create relationships
    try {
      await TagPost.storePostTag(post.id, tagIds)
    } catch (error) {
      console.error(error)
      return Promise.reject(error)
    }

    return Promise.resolve('Post created')
  }

  /**
   * @description the method to fetch post by id
   * @param id id of the post
   * @returns Promise
   */
  public static async getPostById(id: number) {
    try {
      let post = await this.query()
        .where('id', id)
        .preload('user', (userQuery) => {
          userQuery.preload('profile')
        })
        .preload('tags')
        .first()

      if (!post) {
        return Promise.reject('Post not found')
      }

      return Promise.resolve(post)
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }
  }

  /**
   * @description method to update task by id
   * @param data data to be updated
   * @returns Promise
   */
  public static async updatePost(data: UpdatePostType) {
    // preloading post data
    let post: Post | null
    try {
      post = await this.query().where('id', data.id).preload('tags').first()
      if (!post) {
        return Promise.reject('Post not found')
      }
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }

    // updating post data
    post.title = data.title
    post.description = data.description

    // if image name exists then saving new image name
    if (data.imgUrl && data.storagePrefix) {
      post.image_url = data.imgUrl
      post.storage_prefix = data.storagePrefix
    }

    try {
      // saving updated state
      await post.save()
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }

    // deleting old tags
    for (const postTag of post.tags) {
      try {
        await postTag.delete()
      } catch (error) {
        console.error(error)
        return Promise.reject(error.message)
      }
    }

    // creating new tags
    let tagIds: Array<number>
    try {
      // Non-null assertion operator
      tagIds = await Tag.storeTag(data.tags)
    } catch (error) {
      console.error(error)
      return Promise.reject(error)
    }

    // create relationships
    try {
      await TagPost.storePostTag(post.id, tagIds)
    } catch (error) {
      console.error(error)
      return Promise.reject(error)
    }

    return Promise.resolve('Post updated')
  }
}
