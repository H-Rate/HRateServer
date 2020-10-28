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
import { toPlainData } from '../util/sanitize'
import {Users} from '../specs/common'

const UpdateDeviceSchema = util.forkWith(
  DeviceSchema,
  lib.updateDeviceProps,
)

export const RegisterDeviceSchema = util.forkWith(
  DeviceSchema,
  lib.createDeviceProps,
  lib.createDeviceProps,
)


const registerDevice: Controller = async ({ data }) => {
  const device =  toPlainData(await lib.registerDevice(data))
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

export default resource({
  publicProps: [
    'id',
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
        //permission:[isdevice] check if jwt.user.type is device
      },
      publicProps: [
        'token',
      ],
    },
    {
      path: '/@me',
      get: {
        ctrl: getMyDevice,
      },
      publicProps: [
        'id',
        'token',
        'ttl',
        'createdAt',
        'updatedAt'
      ],
    }
  ],
})
