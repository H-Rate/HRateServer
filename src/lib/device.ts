export {
  findDeviceById,
  updateDeviceProps,
  createDeviceProps,
} from '../db/ops/device'
import {CreateDeviceProps,registerDevice as $$registerDevice,findDeviceByDeviceId,updateDevice,findDeviceById,findDeviceByToken,deleteDevice as $$deleteDevice} from  '../db/ops/device'
import type {DeviceDocument,ApplicationDocument} from '../db/models'
import {DeviceAlreadyRegisteredError,TokenAliveError,NoDeviceWithToken,ApplicationNotFoundError} from './errors'
import { isMongoDuplicateError } from '../db/models/_util'
import _ from 'lodash'
import {TOKENDEFAULT} from '../specs'
import dayjs from 'dayjs'
import {createTopic,getSubscribers} from '../pubsub'
import { toPlainData } from '../util/sanitize'
import randtoken from 'rand-token'
import {createSubcscription,removeSubscriber,deleteTopic} from '../pubsub'
import { findApplicationById,getAppllicationsFromSubscriptionNames } from './application'
import {generateToken} from './common'




export const registerDevice = async(data:CreateDeviceProps):Promise<DeviceDocument>=>{
  let device: DeviceDocument
  device = await findDeviceByDeviceId(data.deviceId)
  if(device){
    return device
  }

  data = {...data,topicName:randtoken.generator({chars: 'A-Z'}).generate(12)}

  try{
    device = toPlainData(await $$registerDevice(data))
  }catch(err){
    if(isMongoDuplicateError(err)){
      throw new DeviceAlreadyRegisteredError(data.deviceId)
    }
    throw new Error(err)
  }
  await createTopic(device.topicName)
  return device
}

export const generateDeviceToken = async(deviceMongoId:DeviceDocument['id']):Promise<DeviceDocument>=>{
  const device =  await findDeviceById(deviceMongoId)
  if(dayjs().isBefore(dayjs(device.ttl))) throw new TokenAliveError()
  const token = generateToken(5)
  if(token === TOKENDEFAULT)return generateDeviceToken(deviceMongoId)
  try{
    return updateDevice(device,{token,ttl:dayjs().add(5, 'minute').toDate()})
  }catch(err){
    if(isMongoDuplicateError(err)){
      return generateDeviceToken(deviceMongoId)
    }
    throw new Error(err)
  }
}


export const connect = async(token:DeviceDocument['token'],appId:ApplicationDocument['id']):Promise<{subscriptionName:string}> =>{
  const device = await findDeviceByToken(token)
  if(!device){
    throw new NoDeviceWithToken(token)
  }
  const application = await findApplicationById(appId)
  await createSubcscription(device.topicName,application.subscriptionName)
  return {subscriptionName:application.subscriptionName}
}

export const getDeviceSubscribers = async(deviceMongoId:DeviceDocument['id']):Promise<{id:DeviceDocument['id'],subscriptions:ApplicationDocument[]}> =>{
  const device = await findDeviceById(deviceMongoId)
  const subscribers = await getSubscribers(device.topicName)
  const subscriberNames = subscribers.map(s=> _.last(_.split(s[0]?.name,'/')))
  const applications = await getAppllicationsFromSubscriptionNames(subscriberNames)
  return {id:device.id,subscriptions:applications}
}

export const removeDeviceSubscriber = async(deviceMongoId:DeviceDocument['id'],applicationId:ApplicationDocument['id']):Promise<{id:DeviceDocument['id'],subscriptions:ApplicationDocument[]}> =>{
  const application = await findApplicationById(applicationId)

  if(!application){
    throw new ApplicationNotFoundError(applicationId)
  }

  await removeSubscriber(application.subscriptionName)
  return getDeviceSubscribers(deviceMongoId)
}

export const deleteDevice = async(deviceMongoId:DeviceDocument['id']):Promise<void> =>{
  const device = await findDeviceById(deviceMongoId)
  await deleteTopic(device.topicName)
  await $$deleteDevice(device)
}

