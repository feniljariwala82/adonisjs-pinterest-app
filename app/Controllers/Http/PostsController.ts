import Application from '@ioc:Adonis/Core/Application'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Post from 'App/Models/Post'
import ErrorService from 'App/Services/ErrorService'
import PostStoreValidator from 'App/Validators/PostStoreValidator'
import PostUpdateValidator from 'App/Validators/PostUpdateValidator'
import fs from 'fs'

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
      let user = await Post.getAllByUser(auth.user.id)
      return view.render('post/index', { user })
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
    // validate data
    let payload: any
    try {
      payload = await request.validate(PostStoreValidator)
    } catch (error) {
      console.log(error.messages.errors)
      // errors made by form validator
      let errorMessages = ErrorService.filterMessages(error)
      return response.status(400).json(errorMessages ? errorMessages : error)
    }

    // moving file to the uploads folder
    await payload.postImage.move(Application.tmpPath('uploads'), {
      // renaming the file
      name: cuid() + '.' + payload.postImage.extname,
    })
    let imgName = payload.postImage.fileName

    // creating a post
    let result: string = ''
    try {
      result = await Post.store(payload, imgName!, auth.user!.id)
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }

    session.flash({ success: result })
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
  public async update({ params, response, request, bouncer }: HttpContextContract) {
    let { id } = params

    // validate data
    let payload: any
    try {
      payload = await request.validate(PostUpdateValidator)
    } catch (error) {
      console.log(error.messages.errors)
      // errors made by form validator
      let errorMessages = ErrorService.filterMessages(error)
      return response.status(400).json(errorMessages ? errorMessages : error)
    }

    // checking post available or not
    let post: Post
    try {
      post = await Post.findOrFail(id)
    } catch (error) {
      console.error(error)
      return response.status(400).json('Post not found')
    }

    // checking authorization
    try {
      await bouncer.with('PostPolicy').authorize('update', post)
    } catch (error) {
      console.error(error)
      return response.status(400).json('Not authorized to perform this action')
    }

    /**
     * Removing old image if new image provided
     */
    if (payload.postImage) {
      fs.unlink(Application.tmpPath(post.image_url), (error) => {
        if (error) {
          console.error(error)
          return response.status(400).json(error.message)
        }
      })
    }

    /**
     * adding new image file to the uploads folder
     */
    let imgName: string | undefined
    if (payload.postImage) {
      await payload.postImage.move(Application.tmpPath('uploads'), {
        // renaming the file
        name: cuid() + '.' + payload.postImage.extname,
      })
      imgName = payload.postImage.fileName
    }

    // updating post data
    try {
      let result = await Post.update(id, payload, imgName)
      return response.status(200).json(result)
    } catch (error) {
      console.error(error)
      return response.status(400).json(error)
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
      fs.unlink(Application.tmpPath(post.image_url), (error) => {
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
