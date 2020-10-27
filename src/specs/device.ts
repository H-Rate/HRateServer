import Joi from 'joi'
import type { ObjectId } from './common'
import {ref} from './common'


export interface Device {
  deviceId: string,
  token: string,
  subscribers: ObjectId[],
  topic: string
}

export const DeviceSchema = Joi.object({
  deviceId: Joi.string().required(),
  token: Joi.string().required(),
  subscribers: Joi.array().items(ref('Developer')).default([]),
  topic: Joi.string().required(),
})


