export { DeviceModel, DeviceDocument } from '../models'
import type { Device } from '../../specs/device'
import * as _ from 'lodash'
import type { ClientSession, ModelUpdateOptions, SaveOptions } from 'mongoose'
import make, { FindOptions } from './make'
import type { Optional, Required } from 'utility-types'

export const createDeviceProps = [
  'deviceId'
] as const

export const updateDeviceProps = [
  'subscribers'
] as const

export type CreateDeviceProps = Optional<
  Pick<Required<Device>, typeof createDeviceProps[number]>
>
export type UpdateRDeviceProps = Partial<
  Pick<Device, typeof updateDeviceProps[number]>
>

const ops = make(DeviceModel, {
  create: createDeviceProps,
  update: updateDeviceProps,
})

export const createRegistration = async (
  data: CreateDeviceProps,
  { session }: SaveOptions = {},
): Promise<DeviceDocument> => {
  return ops.create({ session }, data)
}

export const findDeviceById = async (
  id: DeviceDocument['id'],
  options: FindOptions = {},
): Promise<DeviceDocument | null> => {
  return ops.findById({}, id, options)
}

