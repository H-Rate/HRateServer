import { Device, DeviceSchema } from '../../specs/device'
import { model, Schema } from 'mongoose'
import joigoose from '../joigoose'
import type { Document } from './_util'

const schema = new Schema(joigoose.convert(DeviceSchema), {
  timestamps: true,
})
  .index({ deviceId: 1, token: 1 }, { unique: true })
  .index({ deviceId: 1, topic: 1 },{ unique: true})

export type DeviceDocument = Document<Device>
export const DeviceModel = model<DeviceDocument>('Device', schema)
