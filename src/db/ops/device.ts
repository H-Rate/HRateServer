import { DeviceModel, DeviceDocument } from '../models'
import type { Device } from '../../specs/device'
import {TOKENDEFAULT} from '../../specs/device'
import * as _ from 'lodash'
import type { ClientSession, ModelUpdateOptions, SaveOptions } from 'mongoose'
import make, { FindOptions } from './make'
import type { Optional, Required } from 'utility-types'
import dayjs from 'dayjs'

export const createDeviceProps = [
  'deviceId',
  'topicName'
] as const

export const updateDeviceProps = ['token','ttl'] as const

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

export const registerDevice = async (
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

export const findDeviceByDeviceId = async (
  deviceId: DeviceDocument['deviceId'],
  options: FindOptions = {},
): Promise<DeviceDocument | null> => {
  return ops.findOne({}, {deviceId}, options)
}

export const updateDevice = async (
  doc: DeviceDocument,
  data: UpdateRDeviceProps,
): Promise<DeviceDocument | null> => {
  return ops.update({},doc,data)
}

export const findDeviceByToken = async(
  token:DeviceDocument['token'],
):Promise<DeviceDocument | null> => {
  const date = dayjs().toDate()
  return ops.findOne({},{token,ttl:{$gte: date}})
}

export const deleteDevice = async(
  doc:DeviceDocument,
):Promise<DeviceDocument | null> => {
  const date = dayjs().toDate()
  return ops.delete({},doc)
}

export const getDevicesWithExpiredTokens = async():Promise<DeviceDocument[]>=>{
  const date = dayjs().toDate()
  return ops.find({},{token:{$ne:TOKENDEFAULT},ttl:{$lte: date}})
}

export const resetTokens = async(docs:DeviceDocument['id'][],{ session }: SaveOptions = {},):Promise<DeviceDocument[]>=>{
  return DeviceModel.updateMany(
    { _id: { $in: docs } },
    { token: TOKENDEFAULT },
    { runValidators: true, multi: true, session },
  )
}

export const getAllTokens = async():Promise<string[]>=>{
  const devices =  await ops.find({},{token:{$exists:true}})
  return _.uniq(devices.map(d=>d.token))
}

