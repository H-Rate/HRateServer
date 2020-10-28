import Joi from 'joi'
import type { ObjectId } from './common'
import {ref} from './common'

export const TOKENDEFAULT = "11111"


export interface Device {
  deviceId: string,
  token: string,
  ttl: string,
}

export const DeviceSchema = Joi.object({
  deviceId: Joi.string().required(),
  token: Joi.string().optional().min(5).max(5).default(TOKENDEFAULT),
  ttl: Joi.string().isoDate().allow(null).default(null),
})


