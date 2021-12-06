import Application from '@ioc:Adonis/Core/Application'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Post from 'App/Models/Post'
import ErrorService from 'App/Services/ErrorService'
import PostStoreValidator from 'App/Validators/PostStoreValidator'
import PostUpdateValidator from 'App/Validators/PostUpdateValidator'
import fs from 'fs'
import path from 'path'
import Drive from '@ioc:Adonis/Core/Drive'

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
      return view.render('post/index', { posts: user?.posts })
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
    if (!auth.user) {
      return response.status(400).json('Unauthorized')
    }

    // validate data
    // let payload: any
    try {
      let payload = await request.validate(PostStoreValidator)

      // moving file to the uploads folder
      await payload.postImage.moveToDisk(
        auth.user.id.toString(),
        {
          name: cuid() + '.' + payload.postImage.extname,
        },
        'local'
      )
      let imgName = payload.postImage.fileName
      let imgUrl = await Drive.getUrl(path.join(auth.user.id.toString(), imgName!))

      // creating a post
      let result: string = ''
      try {
        result = await Post.store({
          id: auth.user.id,
          title: payload.title,
          description: payload.description,
          imgName: imgName!,
          imgUrl,
          tags: payload.tags,
        })
      } catch (error) {
        console.error(error)
        session.flash({ error })
        return response.redirect().back()
      }

      session.flash({ success: result })
      return response.redirect().toRoute('post.index')
    } catch (error) {
      console.log(error.messages.errors)
      // errors made by form validator
      let errorMessages = ErrorService.filterMessages(error)
      return response.status(400).json(errorMessages ? errorMessages : error)
    }
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
  public async update({ params, response, request, bouncer, auth }: HttpContextContract) {
    let { id } = params

    if (!auth.user) {
      return response.status(400).json('Unauthorized')
    }

    // validate data
    try {
      let payload = await request.validate(PostUpdateValidator)

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
      let imgUrl: string = ''
      let imgName: string | undefined = ''
      if (payload.postImage) {
        await Drive.delete(path.join(post.user_id.toString(), post.image_name))

        /**
         * adding new image file to the uploads folder
         */
        await payload.postImage.moveToDisk(
          auth.user.id.toString(),
          {
            name: cuid() + '.' + payload.postImage.extname,
          },
          'local'
        )
        imgName = payload.postImage.fileName
        imgUrl = await Drive.getUrl(path.join(auth.user.id.toString(), imgName!))
      }

      // updating post data
      try {
        let result = await Post.update({
          id,
          title: payload.title,
          description: payload.description,
          tags: payload.tags,
          imgName,
          imgUrl,
        })
        return response.status(200).json(result)
      } catch (error) {
        console.error(error)
        return response.status(400).json(error)
      }
    } catch (error) {
      console.log(error.messages.errors)
      // errors made by form validator
      let errorMessages = ErrorService.filterMessages(error)
      return response.status(400).json(errorMessages ? errorMessages : error)
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
      await Drive.delete(path.join(post.user_id.toString(), post.image_name))

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
