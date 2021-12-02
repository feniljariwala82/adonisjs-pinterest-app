import {
  BaseModel,
  computed,
  BelongsTo,
  belongsTo,
  column,
  hasMany,
  HasMany,
} from '@ioc:Adonis/Lucid/Orm'
import PostTag from 'App/Models/PostTag'
import Tag from 'App/Models/Tag'
import User from 'App/Models/User'
import { DateTime } from 'luxon'
import path from 'path'

type PostType = {
  title: string
  description: string
  tags: string[]
  postImage: any
}

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

  // post has many tags
  @hasMany(() => PostTag, {
    foreignKey: 'post_id', // defaults to userId
  })
  public postTags: HasMany<typeof PostTag>

  // this will generate URL on every call
  @computed()
  public get imageUrl() {
    if (this.image_url) {
      return path.join('/uploads/' + this.image_url)
    } else {
      return false
    }
  }

  /**
   * @description method to get all the posts
   * @returns Promise
   */
  public static async getAll() {
    try {
      let posts = await this.query()
        .preload('user')
        .preload('postTags', (postTagQuery) => {
          postTagQuery.preload('tag')
        })
        .orderBy('created_at', 'desc')
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
  public static async getAllByUser(userId: number) {
    try {
      let user = await User.query()
        .where('id', userId)
        .preload('posts', (postQuery) => {
          postQuery
            .preload('postTags', (postTagQuery) => {
              postTagQuery.preload('tag')
            })
            .orderBy('created_at', 'desc')
        })
        .first()
      return Promise.resolve(user)
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }
  }

  /**
   * @description get user details by email
   * @param email user email
   * @returns Promise
   */
  public static async getAllByUserEmail(email: string) {
    try {
      let user = await User.query()
        .where('email', email)
        .preload('posts', (postQuery) => {
          postQuery.preload('postTags', (postTagQuery) => {
            postTagQuery.preload('tag')
          })
        })
        .first()

      if (!user) {
        return Promise.reject('User not found with this email id')
      }

      return Promise.resolve(user)
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }
  }

  /**
   * @description the method to create new post
   * @param task task to be created
   * @returns Promise
   */
  public static async store(userId: number, data: PostType, imageName: string) {
    // creating post
    let post: Post
    try {
      post = await this.create({
        title: data.title.toLocaleLowerCase(),
        description: data.description.toLocaleLowerCase(),
        user_id: userId,
        image_url: imageName,
      })
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }

    // creating tags
    let tagIds: Array<number>
    try {
      // Non-null assertion operator
      tagIds = await Tag.store(data.tags)
    } catch (error) {
      console.error(error)
      return Promise.reject(error)
    }

    // create relationships
    try {
      await PostTag.store(post.id, tagIds)
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
        .preload('user')
        .preload('postTags', (postTagQuery) => {
          postTagQuery.preload('tag')
        })
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
   * @param id task id
   * @param data data to be updated
   * @returns Promise
   */
  public static async update(id: number, data: PostType, imageName?: string) {
    // preloading post data
    let post: Post | null
    try {
      post = await this.query()
        .where('id', id)
        .preload('postTags', (postTagQuery) => {
          postTagQuery.preload('tag')
        })
        .first()

      if (!post) {
        return Promise.reject('Post not found')
      }
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }

    // updating post data
    post.title = data.title.toLocaleLowerCase()
    post.description = data.description.toLocaleLowerCase()

    // if image name exists then saving new image name
    if (imageName) {
      post.image_url = imageName
    }
    try {
      await post.save()
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }

    // deleting old tags
    try {
      for (const postTag of post.postTags) {
        await postTag.delete()
      }
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }

    // creating new tags
    let tagIds: Array<number>
    try {
      // Non-null assertion operator
      tagIds = await Tag.store(data.tags)
    } catch (error) {
      console.error(error)
      return Promise.reject(error)
    }

    // create relationships
    try {
      await PostTag.store(post.id, tagIds)
    } catch (error) {
      console.error(error)
      return Promise.reject(error)
    }

    return Promise.resolve('Post updated')
  }
}
