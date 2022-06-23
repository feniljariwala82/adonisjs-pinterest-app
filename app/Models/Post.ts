import {
  BaseModel,
  afterFind,
  beforeSave,
  BelongsTo,
  belongsTo,
  column,
  manyToMany,
  ManyToMany,
  afterFetch,
} from '@ioc:Adonis/Lucid/Orm'
import Drive from '@ioc:Adonis/Core/Drive'
import Tag from 'App/Models/Tag'
import TagPost from 'App/Models/TagPost'
import User from 'App/Models/User'
import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'

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
    post.$extras.imageBaseString = (await Drive.get(post.storage_prefix)).toString('base64')
  }

  @afterFetch()
  public static async afterFetchHook(posts: Post[]) {
    for (const post of posts) {
      post.$extras.imageBaseString = (await Drive.get(post.storage_prefix)).toString('base64')
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
    try {
      const result = await Database.transaction(async (trx) => {
        // creating post
        const post = new Post()
        post.title = data.title
        post.description = data.description
        post.user_id = data.id
        post.image_url = data.imgUrl
        post.storage_prefix = data.storagePrefix

        // creating a transaction
        post.useTransaction(trx)

        // saving post with transaction
        await post.save()

        // finding the tags that already exists
        const existedTags: Tag[] = await Tag.getAllByTagTitle(data.tags)

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
        try {
          await TagPost.storePostTag(
            post.id,
            existedTags.map((tag) => tag.id)
          )
        } catch (error) {
          // if it fails to insert data into pivot table we rollback the transaction
          trx.rollback()
        }

        return Promise.resolve('Post created')
      })

      return result
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }
  }

  /**
   * @description the method to fetch post by id
   * @param id id of the post
   * @returns Promise
   */
  public static async getPostById(id: number) {
    try {
      const post = await this.query()
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
    const trx = await Database.transaction()

    // preloading post data
    let post: Post | null
    try {
      post = await this.query({ client: trx }).where('id', data.id).preload('tags').first()
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
      console.error(error)
      return Promise.reject(error.message)
    }

    try {
      // saving updated state
      post = await post.save()

      await trx.commit()
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }

    // finding the tags that already exists
    let existedTags: Tag[] = []
    try {
      existedTags = await Tag.getAllByTagTitle(data.tags)
    } catch (error) {
      // rollback whole update transaction on failure
      trx.rollback()

      console.error(error)
      return Promise.reject(error)
    }

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
      console.error(error)
      return Promise.reject(error)
    }

    // creating relationships with pre-existing tags
    try {
      await TagPost.storePostTag(
        post.id,
        existedTags.map((tag) => tag.id)
      )
    } catch (error) {
      // rollback whole update transaction on failure
      trx.rollback()

      // throwing error
      console.error(error)
      return Promise.reject(error)
    }

    return Promise.resolve('Post updated')
  }
}
