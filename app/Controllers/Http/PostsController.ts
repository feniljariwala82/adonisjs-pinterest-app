import Drive from '@ioc:Adonis/Core/Drive'
import Env from '@ioc:Adonis/Core/Env'
import { cuid } from '@ioc:Adonis/Core/Helpers'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Post from 'App/Models/Post'
import PostStoreValidator from 'App/Validators/PostStoreValidator'
import PostUpdateValidator from 'App/Validators/PostUpdateValidator'
import path from 'path'
import TagPost from 'App/Models/TagPost'

export default class PostsController {
  /**
   * @description load all the posts for the user
   */
  public async index({ auth, session, response, view }: HttpContextContract) {
    try {
      const user = await Post.getAllByUserIdWithQs(auth.user!.id)
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

    // transaction
    const trx = await Database.transaction()

    // creating a post
    try {
      await Post.storePost(
        {
          id: auth.user!.id,
          title: payload.title,
          description: payload.description,
          storagePrefix,
          tags: payload.tags.map((item) => item.trim().toLowerCase()),
        },
        trx
      )
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
      // if it fails to upload image then roll backing transaction
      await trx.rollback()

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
    const postId = parseInt(id)

    try {
      // fetching particular post
      const post = await Post.getPostById(postId)

      // finding relative posts
      const tagPosts = await TagPost.findRelativePosts(
        post.tags.map((tag) => tag.id),
        postId
      )

      // finding unique post ids
      const uniquePostIds = [...new Set(tagPosts.map((item) => item.post.id))]

      // finding distinct posts
      const posts = await Post.findAll(uniquePostIds)

      const html = await view.render('post/show', {
        post,
        posts,
      })
      return html
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().toRoute('post.index')
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

    // transaction
    const trx = await Database.transaction()

    // updating post data
    try {
      const result = await Post.updatePost(
        {
          id,
          title: payload.title,
          description: payload.description,
          tags: payload.tags.map((item) => item.trim().toLowerCase()),
          storagePrefix,
        },
        trx
      )

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
          // roll back
          await trx.rollback()

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
      return response.redirect().toRoute('post.show', { id })
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

    // Transaction created
    const trx = await Database.transaction()

    try {
      const post = await Post.findOrFail(parseInt(id), { client: trx })

      // checking authorization
      try {
        await bouncer.with('PostPolicy').authorize('delete', post)
      } catch (error) {
        session.flash({ error: 'Unauthorized' })
        return response.redirect().toRoute('post.index')
      }

      // deleting
      try {
        await post.delete()
      } catch (error) {
        console.error(error)
        session.flash({ error: error.message })
        return response.redirect().toRoute('post.index')
      }

      /**
       * Removing image
       */
      try {
        await Drive.delete(post.storage_prefix)

        // committing the transaction
        await trx.commit()
      } catch (error) {
        // rollback delete transaction
        await trx.rollback()

        console.error(error)
        session.flash({ error: error.message })
        return response.redirect().toRoute('post.index')
      }

      session.flash({ success: 'Post deleted' })
      return response.redirect().toRoute('post.index')
    } catch (error) {
      // rollback delete transaction
      await trx.rollback()

      console.error(error)
      session.flash({ error: 'Post not found' })
      return response.redirect().toRoute('post.index')
    }
  }

  public download = async ({ params, response, session }: HttpContextContract) => {
    const { id } = params

    try {
      const post = await Post.getPostById(parseInt(id))
      const location = post.storage_prefix
      const { size } = await Drive.getStats(location)

      response.type(path.extname(location))
      response.header('Content-length', size.toString())
      response.header('Content-Disposition', `attachment; filename=${path.basename(location)}`)

      return response.stream(await Drive.getStream(location))
    } catch (error) {
      console.error(error)
      session.flash({ error: error.message })
      return response.redirect().back()
    }
  }
}
