import { DateTime } from 'luxon'
import { BaseModel, column, BelongsTo, belongsTo, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import User from 'App/Models/User'
import PostTag from 'App/Models/PostTag'

type PostType = {
  title: string
  description: string
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
  public image_name: string

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

  /**
   * @description method to find all the posts for particular user
   * @param userId user id
   * @returns Promise
   */
  public static async getAll(userId: number) {
    try {
      let user = await User.query().where('id', userId).preload('posts').first()
      return Promise.resolve(user?.posts)
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
  public static async store(post: PostType, imageName: string, userId: number) {
    try {
      let result = await this.create({
        title: post.title.toLocaleLowerCase(),
        description: post.description.toLocaleLowerCase(),
        user_id: userId,
        image_name: imageName,
      })
      return Promise.resolve(result)
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
      let result = await this.findOrFail(id)
      return Promise.resolve(result)
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
  public static async update(id: number, data: PostType, imageName: string) {
    // task exists or not
    let task: Post
    try {
      task = await this.getPostById(id)
    } catch (error) {
      console.error(error)
      return Promise.reject(error)
    }

    // updating task data
    task.title = data.title.toLocaleLowerCase()
    task.description = data.description.toLocaleLowerCase()
    task.image_name = imageName
    try {
      await task.save()
      return Promise.resolve('Post updated')
    } catch (error) {
      console.error(error)
      return Promise.reject(error.message)
    }
  }
}
