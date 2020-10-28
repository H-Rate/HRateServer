import { Device, DeviceSchema } from '../../specs/device'
import { model, Schema } from 'mongoose'
import joigoose from '../joigoose'
import type { Document } from './_util'

const schema = new Schema(joigoose.convert(DeviceSchema), {
  timestamps: true,
})
  .index({ deviceId: 1 }, { unique: 1 })
  .index({ deviceId: 1, token: 1 }, { unique: true ,partialFilterExpression: { team: { $ne: "11111" }  }})
  .index({ deviceId: 1, topicName: 1 })

export type DeviceDocument = Document<Device>
export const DeviceModel = model<DeviceDocument>('Device', schema)
