import Router, { RouterContext } from '@koa/router'
import Joi from 'joi'
import _ from 'lodash'
import * as util from '../specs/util'
import * as lib from '../lib/application'
import resource from '../middlewares/resource'
import {ApplicationSchema} from '../specs/application'
import { objectIdOrNull, fetchPopulators } from '../util/controller'
import type { Controller } from '../middlewares/simple-controller'
import { nanoid } from 'nanoid'
import {createJwt} from '../lib/jwt'
import {Users} from '../specs/common'

const UpdateApplicationSchema = util.forkWith(
  ApplicationSchema,
  lib.createApplicationProps,
)

export const CreateApplicationSchema = util.forkWith(
  ApplicationSchema,
  _.without(lib.createApplicationProps,'subscriptionName'),
  lib.createApplicationProps,
)

export const AuthApplicationSchema = util.forkWith(
  ApplicationSchema,
  _.without(lib.createApplicationProps,'name'),
  lib.createApplicationProps,
)

const createApplication: Controller = async ({ data }) => {
  return lib.createApplication(data)
}

const authApplication: Controller = async ({ data }) => {
  const application = await lib.authApplication(data)
  const jwtid = nanoid()
  const token = createJwt(application,Users.APP, jwtid)
  return {jwt:token}
}

const getMyApp:Controller = async({state}) =>{
  return lib.findApplicationById(state.user.sub)
}

const deleteMyApp:Controller = async({state}) =>{
  return lib.deleteApplication(state.user.sub)
}


export default resource({
  publicProps: [
    'name',
    'deviceType'
  ],
  params: {
    application: objectIdOrNull(lib.findApplicationById),
  },
  endpoints: [
    {
      path: '/',
      post: {
        schema: CreateApplicationSchema,
        ctrl: createApplication,
      },
    },
    {
      path: '/auth',
      post: {
        schema: AuthApplicationSchema,
        ctrl: authApplication,
      },
      publicProps:['jwt']
    },
    {
      path: '/@me',
      get: {
        ctrl: getMyApp,
      },
      delete: {
        ctrl: deleteMyApp,
      },
    }
  ],
})
