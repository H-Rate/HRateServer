import { Application, ApplicationSchema } from '../../specs/application'
import { model, Schema } from 'mongoose'
import joigoose from '../joigoose'
import type { Document } from './_util'

const schema = new Schema(joigoose.convert(ApplicationSchema), {
  timestamps: true,
})
  .index({ name: 1 }, { unique: 1 })
  .index({ username: 1 }, { unique: 1 })
  .index({ subscriptionName: 1 }, { unique: 1 })

export type ApplicationDocument = Document<Application>
export const ApplicationModel = model<ApplicationDocument>('Application', schema)
