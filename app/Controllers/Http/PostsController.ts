import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Post from 'App/Models/Post'
import CreatePostValidator from 'App/Validators/CreatePostValidator'
import Application from '@ioc:Adonis/Core/Application'

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
      let posts = await Post.getAll(auth.user.id)
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
    // validate data
    let payload = await request.validate(CreatePostValidator)

    // moving file to the uploads folder
    await payload.post_image.move(Application.tmpPath('uploads'))
    let imgName = payload.post_image.fileName

    // creating a todo
    try {
      let result = await Post.store(payload, imgName!, auth.user!.id)
      session.flash({ success: result })
      return response.redirect().toRoute('task.index')
    } catch (error) {
      console.error(error)
      session.flash({ error })
      return response.redirect().back()
    }
  }

  /**
   * @description show particular post
   */
  public async show({ params, view, session, response, bouncer }: HttpContextContract) {
    let { id } = params

    // fetching particular task
    try {
      let post = await Post.getPostById(id)

      // checking authorization
      try {
        await bouncer.with('PostPolicy').authorize('view', post)
      } catch (error) {
        console.log(error)
        session.flash({ error: 'Not authorized to perform this action' })
        return response.redirect().back()
      }

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

    // fetching particular task
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
   * @description show particular post
   */
  public async update({ params, session, response, request, bouncer }: HttpContextContract) {
    let { id } = params

    // validating data
    let payload = await request.validate(CreatePostValidator)

    // moving file to the uploads folder
    await payload.post_image.move(Application.tmpPath('uploads'))
    let imgName = payload.post_image.fileName

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
