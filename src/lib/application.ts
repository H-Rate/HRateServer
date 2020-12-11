export {
  createApplicationProps,
  updateApplicationProps,
  findApplicationById,
} from '../db/ops/application'
import type { ApplicationDocument } from 'db/models'
import {
  createApplication as $$createApplication,
  CreateApplicationProps,
  findApplicationByUsername,
  findBySubscriptionNames,
  findApplicationById,
  deleteApplication as $$deleteApplication,
  updateApplication,
} from '../db/ops/application'
import type { ClientSession } from 'mongoose'
import bcrypt from 'bcrypt'
import { isMongoDuplicateError } from '../db/models/_util'
import { NameAlreadyUsedError, InvalidPasswordError, SubscriptionNotFoundError } from './errors'
import { deleteSubscription } from '../pubsub'
import _ from 'lodash'

const SALT_WORK_FACTOR = 10

export const createApplication = async (
  data: CreateApplicationProps,
  session?: ClientSession,
): Promise<ApplicationDocument> => {
  data.password = await bcrypt.hash(data.password, SALT_WORK_FACTOR)
  let response: ApplicationDocument
  try {
    response = await $$createApplication(data, { session })
  } catch (err) {
    if (isMongoDuplicateError(err)) {
      console.log(err)
      throw new NameAlreadyUsedError(data.name)
    }
    throw new Error(err)
  }
  return response
}

export const authApplication = async (
  data: CreateApplicationProps,
  session?: ClientSession,
): Promise<ApplicationDocument> => {
  const application = await findApplicationByUsername(data.username)
  if (!(await bcrypt.compare(data.password, application.password))) {
    throw new InvalidPasswordError()
  }
  return application
}

export const getApplicationsFromSubscriptionNames = async (
  subscriptionNames: ApplicationDocument['subscriptionNames'][],
): Promise<ApplicationDocument[]> => {
  return findBySubscriptionNames(subscriptionNames)
}

export const deleteApplication = async (
  applicationId: ApplicationDocument['id'],
): Promise<void> => {
  const application = await findApplicationById(applicationId)
  await Promise.all(application.subscriptionNames.map(s => deleteSubscription(s))).catch()
  await $$deleteApplication(application)
  return
}

export const addSubscrptionNametoApplication = async (
  application: ApplicationDocument,
  subscriptionNames: ApplicationDocument['subscriptionNames'],
): Promise<ApplicationDocument> => {
  return updateApplication(application, {
    subscriptionNames: _.uniq([...application.subscriptionNames, ...subscriptionNames]),
  })
}

export const removeSubscriptionNameFromApplication = async (
  application: ApplicationDocument,
  subscriptionName: string,
): Promise<ApplicationDocument> => {
  const subscriptionNames = application.subscriptionNames.filter(n => n !== subscriptionName)
  return updateApplication(application, { subscriptionNames })
}

export const unSubscribe = async (
  applicationId: ApplicationDocument['id'],
  subscriptionName: string,
): Promise<ApplicationDocument> => {
  const application = await findApplicationById(applicationId)
  if (!application.subscriptionNames.includes(subscriptionName)) {
    throw new SubscriptionNotFoundError(subscriptionName)
  }
  await deleteSubscription(subscriptionName)
  await removeSubscriptionNameFromApplication(application, subscriptionName)
  return findApplicationById(applicationId)
}
