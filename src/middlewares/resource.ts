import Joi from 'joi'
import Router, { RouterContext } from '@koa/router'
import type { Next } from 'koa'
import _ from 'lodash'
import { Props as PublicProps, sanitize } from '../util/sanitize'
import wrapController, { Controller, ParamResolver } from './simple-controller'
import validate from './validate'

export const VERBS = ['get', 'post', 'put', 'patch', 'delete'] as const

export type Condition = (ctx: RouterContext) => boolean | Promise<boolean>
export type DynamicPublicProps = (ctx: RouterContext) => PublicProps

export interface BaseDefinition {
  permissions?: Condition[]
  precondition?: Condition[]
  publicProps?: PublicProps | DynamicPublicProps
}

export interface MethodDefinition extends BaseDefinition {
  schema?: Joi.AnySchema
  ctrl: Controller
}

export interface EndpointDefinition extends BaseDefinition {
  path: string
  get?: MethodDefinition | Controller
  post?: MethodDefinition | Controller
  put?: MethodDefinition | Controller
  patch?: MethodDefinition | Controller
  delete?: MethodDefinition | Controller
}

export interface ResourceDefinition extends BaseDefinition {
  params?: Record<string, ParamResolver>
  endpoints: EndpointDefinition[]
}

type Throw = (_) => number

const notImplemented: Throw = () => 501
const forbidden: Throw = () => 403
const preconditionFailed: Throw = () => 412

export default (config: ResourceDefinition): Router => {
  const router = new Router()

  for (const [name, resolve] of Object.entries(config.params || {})) {
    router.param(name, async (id, ctx, next) => {
      const val = await resolve(id, ctx)
      ctx.assert(val, 404)
      ctx.state[name] = val
      return next()
    })
  }

  for (const { path, ...endpoint } of config.endpoints) {
    for (const verb of _.intersection(_.keys(endpoint), VERBS)) {
      const method_ = endpoint[verb] || {}
      const method = _.isFunction(method_) ? { ctrl: method_ } : method_

      const cond = (throw_: Throw, prop: string) => (ctx: RouterContext, next: Next) => {
        return ([
          ...(config[prop] || []),
          ...(endpoint[prop] || []),
          ...(method[prop] || []),
        ] as Condition[])
          .reduce((rv, next) => rv.then(ok => ok && next(ctx)), Promise.resolve(true))
          .then(ok => (ok ? next() : throw_(ctx)))
      }

      router[verb](
        path,
        cond(forbidden, 'permissions'),
        cond(preconditionFailed, 'precondition'),
        validate(method.schema || Joi.any()),
        wrapController(method.ctrl || notImplemented, (data: unknown): unknown =>
          sanitize(method.publicProps || endpoint.publicProps || config.publicProps, data),
        ),
      )
    }
  }
  return router
}
