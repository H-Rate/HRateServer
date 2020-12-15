import Router from '@koa/router'
import compose from 'koa-compose'
import type { Middleware } from 'koa'

const router = new Router()

router.use(ctx => {
  ctx.body = 'Welcome to Hrate Server'
  ctx.status = 200
})

export default (): Middleware => {
  return compose([router.routes(), router.allowedMethods()])
}
