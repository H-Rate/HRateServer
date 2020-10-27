import Router from '@koa/router'
import compose from 'koa-compose'
import type { Middleware } from 'koa'
import {registrationRouter} from './controller/register'

const router = new Router()

router.use('/register', registrationRouter.routes(), registrationRouter.allowedMethods())

export default (): Middleware => {
  return compose([router.routes(), router.allowedMethods()])
}

