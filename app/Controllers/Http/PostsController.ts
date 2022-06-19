import Drive from '@ioc:Adonis/Core/Drive'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Post from 'App/Models/Post'
import ErrorService from 'App/Services/ErrorService'
import PostStoreValidator from 'App/Validators/PostStoreValidator'
import PostUpdateValidator from 'App/Validators/PostUpdateValidator'
import path from 'path'

export default class PostsController {
  /**
   * @description load all the posts for the user
   */
  public async index({ auth, session, response, view }: HttpContextContract) {
    try {
      const user = await Post.getAllByUserId(auth.user!.id)
      const html = await view.render('post/index', { posts: user?.posts })
      return html
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
    const html = await view.render('post/create')
    return html
  }

  /**
   * @description to save new post
   */
  public async store({ request, response, auth }: HttpContextContract) {
    try {
      const payload = await request.validate(PostStoreValidator)

      const imageName = `${cuid()}.${payload.postImage.extname}`

      // moving file to the uploads folder/aws s3
      try {
        await payload.postImage.moveToDisk(auth.user!.id.toString(), { name: imageName }, 'local')
      } catch (error) {
        console.error(error)
        return response.status(400).json(error.message)
      }

      const storagePrefix = path.join(auth.user!.id.toString(), imageName)

      const imgUrl = await Drive.getUrl(storagePrefix)

      // creating a post
      try {
        await Post.storePost({
          id: auth.user!.id,
          title: payload.title,
          description: payload.description,
          storagePrefix,
          imgUrl,
          tags: payload.tags,
        })
      } catch (error) {
        console.error(error)
        return response.status(400).json(error)
      }

      return response.status(200).json('Post created')
    } catch (error) {
      // errors made by form validator
      const errorMessages = ErrorService.filterMessages(error)
      return response.status(400).json(errorMessages ? errorMessages : error)
    }
  }

  /**
   * @description show particular post
   */
  public async show({ params, view, session, response }: HttpContextContract) {
    const { id } = params

    // fetching particular post
    try {
      const post = await Post.getPostById(id)
      const html = await view.render('post/show', { post })
      return html
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
    const { id } = params

    // fetching particular post
    try {
      const post = await Post.getPostById(id)

      // checking authorization
      try {
        await bouncer.with('PostPolicy').authorize('edit', post)
      } catch (error) {
        session.flash({ error: 'Unauthorized' })
        return response.redirect().back()
      }

      const html = await view.render('post/edit', { post })
      return html
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }
  }

  /**
   * @description update particular post
   */
  public async update({ params, response, request, bouncer, auth }: HttpContextContract) {
    const { id } = params

    // validate data
    try {
      const payload = await request.validate(PostUpdateValidator)

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
        return response.status(400).json('Unauthorized')
      }

      /**
       * Removing old image if new image provided
       */
      let imgUrl: string = ''
      let imgName: string | undefined
      let storagePrefix: string = ''
      if (payload.postImage) {
        // deleting old image from storage
        await Drive.delete(post.storage_prefix)

        imgName = `${cuid()}.${payload.postImage.extname}`

        /**
         * adding new image file to the uploads folder
         */
        await payload.postImage.moveToDisk(auth.user!.id.toString(), { name: imgName }, 'local')

        // new storage prefix
        storagePrefix = path.join(auth.user!.id.toString(), imgName)
        // new url
        imgUrl = await Drive.getUrl(storagePrefix)
      }

      // updating post data
      try {
        const result = await Post.updatePost({
          id,
          title: payload.title,
          description: payload.description,
          tags: payload.tags,
          imgUrl,
          storagePrefix,
        })
        return response.status(200).json(result)
      } catch (error) {
        console.error(error)
        return response.status(400).json(error)
      }
    } catch (error) {
      // errors made by form validator
      const errorMessages = ErrorService.filterMessages(error)
      return response.status(400).json(errorMessages ? errorMessages : error)
    }
  }

  /**
   * @description delete particular post
   */
  public async destroy({ params, session, response, bouncer }: HttpContextContract) {
    const { id } = params

    try {
      const post = await Post.getPostById(id)

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
      try {
        await Drive.delete(post.storage_prefix)
      } catch (error) {
        console.error(error)
        session.flash({ error: error.message })
        return response.redirect().back()
      }

      // deleting
      try {
        await post.delete()
        session.flash({ success: 'Post deleted' })
        return response.redirect().toRoute('post.index')
      } catch (error) {
        console.error(error)
        session.flash({ error: error.message })
        return response.redirect().back()
      }
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }
  }
}
