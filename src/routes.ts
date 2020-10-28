import Router from '@koa/router'
import compose from 'koa-compose'
import type { Middleware } from 'koa'
import deviceRouter from './controller/device'
import applicationRouter from './controller/application'

const router = new Router()

router.use('/device', deviceRouter.routes(), deviceRouter.allowedMethods())
router.use('/application', applicationRouter.routes(), applicationRouter.allowedMethods())

export default (): Middleware => {
  return compose([router.routes(), router.allowedMethods()])
}

