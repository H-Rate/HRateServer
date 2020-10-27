import Router, { RouterContext } from '@koa/router'

export const  registrationRouter = new Router()

registrationRouter.post('/watch',(ctx,next)=>{
  console.log(ctx)
})
