import Router, { RouterContext } from '@koa/router'
import Joi from 'joi'
import _ from 'lodash'
import * as util from '../specs/util'
import * as lib from '../lib/device'
import resource from '../middlewares/resource'
import {DeviceSchema} from '../specs/device'
import { objectIdOrNull, fetchPopulators } from '../util/controller'
import type { Controller } from '../middlewares/simple-controller'
import { nanoid } from 'nanoid'
import {createJwt} from '../lib/jwt'
import {Users} from '../specs/common'
import {isDevice,isApplication} from './conditions'

const UpdateDeviceSchema = util.forkWith(
  DeviceSchema,
  lib.updateDeviceProps,
)

export const RegisterDeviceSchema = util.forkWith(
  DeviceSchema,
  _.without(lib.createDeviceProps,'topicName'),
  lib.createDeviceProps,
)

export const ConnectDeviceSchema  = Joi.object({
  token:Joi.string().required(),
})

export const RemoveDeviceSubscriberSchema  = Joi.object({
  subscriber:Joi.string().required(),
})


const registerDevice: Controller = async ({ data }) => {
  const device =  await lib.registerDevice(data)
  const jwtid = nanoid()
  const token = createJwt(device,Users.DEVICE, jwtid)
  return {jwt:token}
}

const generateToken: Controller = async ({ state }) => {
  return lib.generateDeviceToken(state.user.sub)
}

const getMyDevice: Controller = async ({ state }) => {
  return lib.findDeviceById(state.user.sub)
}

const connectToDevice: Controller = async ({ state,data }) => {
  return lib.connect(data.token,state.user.sub)
}

const getMySubscribers: Controller = async ({ state,data }) => {
  return lib.getDeviceSubscribers(state.user.sub)
}

const removeSubscriber: Controller = async ({ state,data }) => {
  return lib.removeDeviceSubscriber(state.user.sub,data.subscriber)
}

const deleteMyDevice: Controller = async ({ state }) => {
  return lib.deleteDevice(state.user.sub)
}

export default resource({
  publicProps: [
    'id',
    'topicName',
  ],
  params: {
    device: objectIdOrNull(lib.findDeviceById),
  },
  endpoints: [
    {
      path: '/',
      post: {
        schema: RegisterDeviceSchema,
        ctrl: registerDevice,
      },
      publicProps: [
        'jwt',
      ],
    },
    {
      path: '/generateToken',
      post: {
        ctrl: generateToken,
        permissions:[isDevice]
      },
      publicProps: [
        'token',
      ],
    },
    {
      path: '/connect',
      post: {
        schema: ConnectDeviceSchema,
        ctrl: connectToDevice,
        permissions:[isApplication]
      },
      publicProps: [
        'topicName',
        'subscriptionName',
      ],
    },
    {
      path: '/@me',
      get: {
        ctrl: getMyDevice,
      },
      delete:{
        ctrl: deleteMyDevice
      },
      publicProps: [
        'id',
        'token',
        'ttl',
        'topicName',
        'createdAt',
        'updatedAt',
      ],
      permissions:[isDevice]
    },
    {
      path: '/@me/subscribers',
      get: {
        ctrl: getMySubscribers,
      },
      publicProps: [
        'id',
        'subscriptions',
      ],
      permissions:[isDevice]
    },
    {
      path:'/@me/subscribers/remove',
      patch:{
        ctrl:removeSubscriber,
        schema:RemoveDeviceSubscriberSchema
      },
      publicProps: [
        'id',
        'subscriptions',
      ],
      permissions:[isDevice]
    },
  ],
})


