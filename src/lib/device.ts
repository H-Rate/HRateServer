export {
  findDeviceById,
  updateDeviceProps,
  createDeviceProps,
} from '../db/ops/device'
import {CreateDeviceProps,registerDevice as $$registerDevice,findDeviceByDeviceId,updateDevice,findDeviceById} from  '../db/ops/device'
import type {DeviceDocument} from '../db/models'
import {DeviceAlreadyRegisteredError,TokenAliveError} from './errors'
import { isMongoDuplicateError } from '../db/models/_util'
import _ from 'lodash'
import {TOKENDEFAULT} from '../specs'
import dayjs from 'dayjs'

const TOKENVALUES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"


export const registerDevice = async(data:CreateDeviceProps):Promise<DeviceDocument>=>{
  let device: DeviceDocument
  device = await findDeviceByDeviceId(data.deviceId)
  if(device){
    return device
  }

  try{
    device = await $$registerDevice(data)
  }catch(err){
    if(isMongoDuplicateError(err)){
      throw new DeviceAlreadyRegisteredError(data.deviceId)
    }
    throw new Error(err)
  }
  return device
}

const generateToken = ():string =>{
  const tokenValuesArray = _.split(TOKENVALUES,'');
  return _.join(_.range(5).map(x=>{
    return tokenValuesArray[_.random(tokenValuesArray.length)]
  }),'')
}

export const generateDeviceToken = async(deviceMongoId:DeviceDocument['id']):Promise<DeviceDocument>=>{
  const device =  await findDeviceById(deviceMongoId)
  if(dayjs().isBefore(dayjs(device.ttl))) throw new TokenAliveError()
  const token = generateToken()
  if(token === TOKENDEFAULT)return generateDeviceToken(deviceMongoId)
  try{
    return updateDevice(device,{token,ttl:dayjs().add(5, 'minute').toISOString()})
  }catch(err){
    if(isMongoDuplicateError(err)){
      return generateDeviceToken(deviceMongoId)
    }
    throw new Error(err)
  }
}


