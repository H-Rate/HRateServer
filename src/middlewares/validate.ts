import Joi, { AnySchema } from 'joi'
import type { Middleware, RouterContext } from '@koa/router'
import type { Next } from 'koa'

export default (body: AnySchema): Middleware => {
  return async (ctx: RouterContext, next: Next): Promise<void> => {
    try {
      Joi.assert(ctx.request.body, body)
      return next()
    } catch (e) {
      ctx.status = 400
      ctx.body = {
        message: e.message,
        details: e.details,
      }
    }
  }
}
