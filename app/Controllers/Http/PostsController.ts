import Drive from '@ioc:Adonis/Core/Drive'
import Env from '@ioc:Adonis/Core/Env'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Post from 'App/Models/Post'
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
  public async store({ request, response, auth, session }: HttpContextContract) {
    // validating form data
    const payload = await request.validate(PostStoreValidator)

    // generating new name
    const imageName = `${cuid()}.${payload.postImage.extname}`

    // to save it as a posix path
    const storagePrefix = path.posix.join(auth.user!.id.toString(), imageName)

    // creating a post
    try {
      await Post.storePost({
        id: auth.user!.id,
        title: payload.title,
        description: payload.description,
        storagePrefix,
        tags: payload.tags.map((item) => item.trim().toLowerCase()),
      })
    } catch (error) {
      session.flash({ error })
      return response.redirect().back()
    }

    // moving file to the uploads folder/aws s3 on successful record creation
    try {
      await payload.postImage.moveToDisk(
        auth.user!.id.toString(),
        { name: imageName },
        Env.get('DRIVE_DISK')
      )
    } catch (error) {
      console.error(error)
      session.flash({ error: error.message })
      return response.redirect().back()
    }

    session.flash({ success: 'Post created' })
    return response.redirect().toRoute('post.index')
  }

  /**
   * @description show particular post
   */
  public async show({ params, view, session, response }: HttpContextContract) {
    const { id } = params

    // fetching particular post
    try {
      const post = await Post.getPostById(parseInt(id))
      const html = await view.render('post/show', { post })
      return html
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().toRoute('home')
    }
  }

  /**
   * @description edit particular post
   */
  public async edit({ params, view, session, response, bouncer }: HttpContextContract) {
    const { id } = params

    // fetching particular post
    try {
      const post = await Post.getPostById(parseInt(id))

      // checking authorization
      try {
        await bouncer.with('PostPolicy').authorize('edit', post)
      } catch (error) {
        session.flash({ error: 'Unauthorized' })
        return response.redirect().toRoute('home')
      }

      const html = await view.render('post/edit', { post })
      return html
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().toRoute('home')
    }
  }

  /**
   * @description update particular post
   */
  public async update({ params, response, request, bouncer, auth, session }: HttpContextContract) {
    const { id } = params

    // validate data
    const payload = await request.validate(PostUpdateValidator)

    // checking post available or not
    let post: Post
    try {
      post = await Post.findOrFail(parseInt(id))
    } catch (error) {
      session.flash({ error })
      return response.redirect().back()
    }

    // checking authorization
    try {
      await bouncer.with('PostPolicy').authorize('update', post)
    } catch (error) {
      console.error(error)
      session.flash({ error: 'Unauthorized' })
      return response.redirect().toRoute('post.index')
    }

    /**
     * Removing old image if new image provided
     */
    let imgName: string | undefined
    let storagePrefix: string = ''
    let toBeDeletedImage: string = ''

    if (payload.postImage) {
      // old storage prefix
      toBeDeletedImage = post.storage_prefix

      // new image name
      imgName = `${cuid()}.${payload.postImage.extname}`

      // new storage prefix
      storagePrefix = path.posix.join(auth.user!.id.toString(), imgName)
    }

    // updating post data
    try {
      const result = await Post.updatePost({
        id,
        title: payload.title,
        description: payload.description,
        tags: payload.tags.map((item) => item.trim().toLowerCase()),
        storagePrefix,
      })

      /**
       * on successful attempt deleting old image and shifting new image to S3
       */
      if (payload.postImage) {
        /**
         * adding new image file to the uploads folder
         */
        try {
          await payload.postImage.moveToDisk(
            auth.user!.id.toString(),
            { name: imgName },
            Env.get('DRIVE_DISK')
          )
        } catch (error) {
          console.error(error)
          session.flash({ error: error.message })
          return response.redirect().back()
        }

        /**
         * removing old file
         */
        try {
          await Drive.delete(toBeDeletedImage)
        } catch (error) {
          console.error(error)
          session.flash({ error: error.message })
          return response.redirect().back()
        }
      }

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
    const { id } = params

    try {
      const post = await Post.getPostById(id)

      // checking authorization
      try {
        await bouncer.with('PostPolicy').authorize('delete', post)
      } catch (error) {
        session.flash({ error: 'Unauthorized' })
        return response.redirect().toRoute('post.index')
      }

      /**
       * Removing image
       */
      try {
        await Drive.delete(post.storage_prefix)
      } catch (error) {
        console.error(error)
        session.flash({ error: error.message })
        return response.redirect().toRoute('post.index')
      }

      // deleting
      try {
        await post.delete()
        session.flash({ success: 'Post deleted' })
        return response.redirect().toRoute('post.index')
      } catch (error) {
        console.error(error)
        session.flash({ error: error.message })
        return response.redirect().toRoute('post.index')
      }
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().toRoute('post.index')
    }
  }

  public download = async ({ params, response, session }: HttpContextContract) => {
    const { id } = params

    try {
      const post = await Post.getPostById(parseInt(id))
      const url = await Drive.getSignedUrl(post.storage_prefix, { expiresIn: '2mins' })

      if (Env.get('NODE_ENV') === 'development') {
        return response.redirect(`http://${Env.get('HOST')}:${Env.get('PORT')}${url}`)
      } else {
        return response.redirect(url)
      }
    } catch (error) {
      console.error(error)
      session.flash({ error: error.message })
      return response.redirect().back()
    }
  }
}
