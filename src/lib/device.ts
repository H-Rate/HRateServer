export { findDeviceById, updateDeviceProps, createDeviceProps } from '../db/ops/device'
import {
  CreateDeviceProps,
  registerDevice as $$registerDevice,
  findDeviceByDeviceId,
  updateDevice,
  findDeviceById,
  findDeviceByToken,
  deleteDevice as $$deleteDevice,
  getDevicesWithExpiredTokens,
  resetTokens,
  getAllTokens,
} from '../db/ops/device'
import type { DeviceDocument, ApplicationDocument } from '../db/models'
import {
  DeviceAlreadyRegisteredError,
  TokenAliveError,
  NoDeviceWithToken,
  ApplicationNotFoundError,
  AlreadySubscribedError,
  SubscriptionNotFoundError,
} from './errors'
import { isMongoDuplicateError } from '../db/models/_util'
import _ from 'lodash'
import { TOKENDEFAULT } from '../specs'
import dayjs from 'dayjs'
import { createTopic, deleteSubscription, getSubscribers } from '../pubsub'
import { toPlainData } from '../util/sanitize'
import randtoken from 'rand-token'
import { createSubcscription, removeSubscriber, deleteTopic } from '../pubsub'
import {
  findApplicationById,
  getApplicationsFromSubscriptionNames,
  addSubscrptionNametoApplication,
  removeSubscriptionNameFromApplication,
} from './application'
import { generateToken } from './common'
import uniqid from 'uniqid'

export const registerDevice = async (data: CreateDeviceProps): Promise<DeviceDocument> => {
  let device: DeviceDocument
  device = await findDeviceByDeviceId(data.deviceId)
  if (device) {
    return device
  }

  data = { ...data, topicName: uniqid('topic-') }

  try {
    device = toPlainData(await $$registerDevice(data)) as DeviceDocument
  } catch (err) {
    if (isMongoDuplicateError(err)) {
      throw new DeviceAlreadyRegisteredError(data.deviceId)
    }
    throw new Error(err)
  }
  await createTopic(device.topicName)
  return device
}

export const generateDeviceToken = async (
  deviceMongoId: DeviceDocument['id'],
): Promise<DeviceDocument> => {
  const device = await findDeviceById(deviceMongoId)
  if (dayjs().isBefore(dayjs(device.ttl).subtract(1, 'minute'))) throw new TokenAliveError()
  const allTokens = await getAllTokens()
  const token = generateToken(5, allTokens)
  if (token === TOKENDEFAULT) return generateDeviceToken(deviceMongoId)
  try {
    return updateDevice(device, { token, ttl: dayjs().add(5, 'minute').toDate() })
  } catch (err) {
    if (isMongoDuplicateError(err)) {
      return generateDeviceToken(deviceMongoId)
    }
    throw new Error(err)
  }
}

export const getDeviceSubscribers = async (
  deviceMongoId: DeviceDocument['id'],
): Promise<{ id: DeviceDocument['id']; subscriptions: ApplicationDocument[] }> => {
  const device = await findDeviceById(deviceMongoId)
  const [subscribers] = await getSubscribers(device.topicName)
  const subscriberNames = subscribers.map(s => _.last(_.split(s?.name, '/')))
  const applications = await getApplicationsFromSubscriptionNames(subscriberNames)
  return { id: device.id, subscriptions: applications }
}

export const connect = async (
  token: DeviceDocument['token'],
  appId: ApplicationDocument['id'],
): Promise<{ subscriptionName: string }> => {
  const device = await findDeviceByToken(token)
  if (!device) {
    throw new NoDeviceWithToken(token)
  }
  const subscribers = await getDeviceSubscribers(device.id)
  const apps = await subscribers.subscriptions.map(s => s.id)
  if (apps.includes(appId)) {
    throw new AlreadySubscribedError(appId)
  }

  const application = await findApplicationById(appId)
  const subscriptionName = uniqid('sub-')
  await addSubscrptionNametoApplication(application, [subscriptionName])
  await createSubcscription(device.topicName, subscriptionName)
  return { subscriptionName: subscriptionName }
}

export const removeDeviceSubscriber = async (
  deviceMongoId: DeviceDocument['id'],
  subscriptionName: string,
): Promise<{ id: DeviceDocument['id']; subscriptions: ApplicationDocument[] }> => {
  let [application] = await getApplicationsFromSubscriptionNames([[subscriptionName]])
  application = await findApplicationById(application.id)

  if (!application) {
    throw new ApplicationNotFoundError(subscriptionName)
  }

  if (!application.subscriptionNames.includes(subscriptionName)) {
    throw new SubscriptionNotFoundError(subscriptionName)
  }

  await deleteSubscription(subscriptionName)
  await removeSubscriptionNameFromApplication(application, subscriptionName)
  return getDeviceSubscribers(deviceMongoId)
}

export const deleteDevice = async (deviceMongoId: DeviceDocument['id']): Promise<void> => {
  const device = await findDeviceById(deviceMongoId)
  await deleteTopic(device.topicName)
  await $$deleteDevice(device)
}

export const resetExpiredTokens = async (): Promise<void> => {
  const devices = await getDevicesWithExpiredTokens()
  await resetTokens(devices.map(d => d.id))
}
