import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Post from 'App/Models/Post'
import CreatePostValidator from 'App/Validators/CreatePostValidator'
import Application from '@ioc:Adonis/Core/Application'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import Tag from 'App/Models/Tag'
import PostTag from 'App/Models/PostTag'
import Drive from '@ioc:Adonis/Core/Drive'
import fs from 'fs'
import path from 'path'

export default class PostsController {
  /**
   * @description load all the posts for the user
   */
  public async index({ auth, session, response, view }: HttpContextContract) {
    if (!auth.user) {
      session.flash({ error: 'Please login to continue' })
      return response.redirect().back()
    }

    try {
      let posts = await Post.getAllByUser(auth.user.id)
      return view.render('post/index', { posts })
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }
  }

  /**
   * @description to display post create form
   */
  public async create({ view }: HttpContextContract) {
    return view.render('post/create')
  }

  /**
   * @description to save new post
   */
  public async store({ request, session, response, auth }: HttpContextContract) {
    console.log(request.all())

    // validate data
    let payload = await request.validate(CreatePostValidator)

    // moving file to the uploads folder
    await payload.postImage.move(Application.tmpPath('uploads'), {
      // renaming the file
      name: cuid() + '.' + payload.postImage.extname,
    })
    let imgName = payload.postImage.fileName

    // creating a post
    let post: Post
    try {
      post = await Post.store(payload, imgName!, auth.user!.id)
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }

    // creating tags
    let tagIds: Array<number>
    try {
      // Non-null assertion operator
      tagIds = await Tag.store(payload.tags!)
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }

    // create relationships
    try {
      await PostTag.store(post.id, tagIds)
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }

    session.flash({ success: 'post created' })
    return response.redirect().toRoute('post.index')
  }

  /**
   * @description show particular post
   */
  public async show({ params, view, session, response }: HttpContextContract) {
    let { id } = params

    // fetching particular post
    try {
      let post = await Post.getPostById(id)
      return view.render('post/show', { post })
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }
  }

  /**
   * @description edit particular post
   */
  public async edit({ params, view, session, response, bouncer }: HttpContextContract) {
    let { id } = params

    // fetching particular post
    try {
      let post = await Post.getPostById(id)

      // checking authorization
      try {
        await bouncer.with('PostPolicy').authorize('edit', post)
      } catch (error) {
        session.flash({ error: 'Not authorized to perform this action' })
        return response.redirect().back()
      }

      return view.render('post/edit', { post })
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }
  }

  /**
   * @description update particular post
   */
  public async update({ params, session, response, request, bouncer }: HttpContextContract) {
    let { id } = params

    // validating data
    let payload = await request.validate(CreatePostValidator)

    // moving file to the uploads folder
    await payload.postImage.move(Application.tmpPath('uploads'))
    let imgName = payload.postImage.fileName

    // checking authorization
    let post = await Post.getPostById(id)
    try {
      await bouncer.with('PostPolicy').authorize('update', post)
    } catch (error) {
      session.flash({ error: 'Not authorized to perform this action' })
      return response.redirect().back()
    }

    // updating post data
    try {
      let result = await Post.update(id, payload, imgName!)
      session.flash({ success: result })
      return response.redirect().toRoute('post.index')
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }
  }

  /**
   * @description delete particular post
   */
  public async destroy({ params, session, response, bouncer }: HttpContextContract) {
    let { id } = params

    try {
      let post = await Post.getPostById(id)

      // checking authorization
      try {
        await bouncer.with('PostPolicy').authorize('delete', post)
      } catch (error) {
        session.flash({ error: 'Not authorized to perform this action' })
        return response.redirect().back()
      }

      /**
       * Removing image
       */
      fs.unlink(Application.tmpPath(post.image_name), (error) => {
        if (error) {
          console.error(error)
          session.flash({ error: error.message })
          return response.redirect().back()
        }

        console.log('File is deleted.')
      })

      // deleting
      await post.delete()

      session.flash({ success: 'Post deleted' })
      return response.redirect().toRoute('post.index')
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }
  }
}
