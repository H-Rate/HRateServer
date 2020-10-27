import Router from '@koa/router'
import compose from 'koa-compose'
import type { Middleware } from 'koa'
import deviceRouter from './controller/device'

const router = new Router()

router.use('/device', deviceRouter.routes(), deviceRouter.allowedMethods())

export default (): Middleware => {
  return compose([router.routes(), router.allowedMethods()])
}

