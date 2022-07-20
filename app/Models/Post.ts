import Drive from '@ioc:Adonis/Core/Drive'
import { TransactionClientContract } from '@ioc:Adonis/Lucid/Database'
import {
  afterFetch,
  afterFind,
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

  @afterFind()
  public static async afterFindHook(post: Post) {
    try {
      const imageBaseString = await Drive.get(post.storage_prefix)
      post.$extras.imageBaseString = imageBaseString.toString('base64')
    } catch (error) {
      console.error(error.message)
    }
  }

  @afterFetch()
  public static async afterFetchHook(posts: Post[]) {
    for (const post of posts) {
      try {
        const imageBaseString = await Drive.get(post.storage_prefix)
        post.$extras.imageBaseString = imageBaseString.toString('base64')
      } catch (error) {
        console.error(error.message)
      }
    }
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
  public static async getAllByUserIdWithQs(userId: number) {
    const user = await User.query()
      .where('id', userId)
      .preload('posts', (postQuery) => {
        postQuery.orderBy('created_at', 'desc')
      })
      .first()
    return user
  }

  /**
   * @description the method to create new post
   * @returns Promise
   */
  public static async storePost(data: StorePostType, trx: TransactionClientContract) {
    // creating post using transaction
    const post = await this.create(
      {
        title: data.title,
        description: data.description,
        user_id: data.id,
        storage_prefix: data.storagePrefix,
      },
      { client: trx }
    )

    // finding the tags that already exists
    const existedTags = await Tag.getAllByTagTitle(data.tags)

    // data type to insert new tag into relationship
    const newTags: { title: string }[] = []

    // tag string array
    const existedTagList = existedTags.map((tag) => tag.title)
    data.tags.map((tag) => {
      if (!existedTagList.includes(tag)) {
        // if tag does not exist then adding it into new tags
        newTags.push({ title: tag })
      }
    })

    // inserting the tags that are new
    await post.related('tags').createMany(newTags)

    // creating relationships with pre-existing tags
    await TagPost.storePostTag(
      post.id,
      existedTags.map((tag) => tag.id),
      trx
    )

    return 'Post created'
  }

  /**
   * @description the method to fetch post by id
   * @param id id of the post
   * @returns Promise
   */
  public static async getPostById(id: number) {
    const post = await this.query()
      .where('id', id)
      .preload('user', (userQuery) => {
        userQuery.preload('profile')
      })
      .preload('tags')
      .first()
    /**
     * if post not found then throwing an error
     */
    if (!post) {
      throw new Error('Post not found')
    }
    return post
  }

  /**
   * @description method to update task by id
   * @param data data to be updated
   * @returns Promise
   */
  public static async updatePost(data: UpdatePostType, trx: TransactionClientContract) {
    // preloading post data
    let post: Post | null
    try {
      post = await this.query({ client: trx }).where('id', data.id).preload('tags').first()
      if (!post) {
        // roll back
        await trx.rollback()

        return Promise.reject('Post not found')
      }
    } catch (error) {
      // roll back
      await trx.rollback()

      console.error(error)
      return Promise.reject(error.message)
    }

    // updating post data
    post.title = data.title
    post.description = data.description

    // if image prefix exists then saving new image storage prefix
    if (data.storagePrefix) {
      post.storage_prefix = data.storagePrefix
    }

    // tags removed
    const removedTagIds: number[] = []
    post.tags.map((tag) => {
      if (!data.tags.includes(tag.title)) {
        removedTagIds.push(tag.id)
      }
    })

    // removing removed tags
    try {
      await post.related('tags').detach(removedTagIds)
    } catch (error) {
      // roll back
      await trx.rollback()

      console.error(error)
      return Promise.reject(error.message)
    }

    // saving updated state
    try {
      post = await post.save()
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }

    // finding the tags that already exists
    const existedTags = await Tag.getAllByTagTitle(data.tags)

    // data type to insert new tag into relationship
    const newTags: { title: string }[] = []

    // existing tag list
    const existedTagList = existedTags.map((tag) => tag.title)

    // generating new tag list
    data.tags.map((tag) => {
      if (!existedTagList.includes(tag)) {
        // if tag does not exist then adding it into new tags
        newTags.push({ title: tag })
      }
    })

    // inserting the tags that are new
    try {
      // creating new tags using related method
      await post.related('tags').createMany(newTags)
    } catch (error) {
      // rollback whole update transaction on failure
      await trx.rollback()

      console.error(error)
      return Promise.reject(error)
    }

    // creating relationships with pre-existing tags

    await TagPost.storePostTag(
      post.id,
      existedTags.map((tag) => tag.id),
      trx
    )

    return 'Post updated'
  }

  /**
   * @description finds distinct posts
   * @param ids id field of post
   * @returns Promise
   */
  public static findAll = async (ids: number[]) => {
    const posts = await this.query().whereIn('id', ids)
    return posts
  }
}
