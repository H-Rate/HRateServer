export {createApplicationProps, updateApplicationProps,findApplicationById} from '../db/ops/application'
import type { ApplicationDocument } from 'db/models'
import {createApplication as $$createApplication,CreateApplicationProps, findApplicationByUsername,findBySubscriptionNames,findApplicationById,deleteApplication as $$deleteApplication} from '../db/ops/application'
import type { ClientSession } from 'mongoose'
import bcrypt from 'bcrypt'
import { isMongoDuplicateError } from '../db/models/_util'
import {NameAlreadyUsedError,InvalidPasswordError} from './errors'
import {generateToken} from './common'
import {deleteSubscription}  from '../pubsub'


const SALT_WORK_FACTOR = 10;


export const createApplication = async(data:CreateApplicationProps,session?: ClientSession,) : Promise<ApplicationDocument> =>{
  data.password = await bcrypt.hash(data.password,SALT_WORK_FACTOR)
  data.subscriptionName = generateToken(10)
  let response:ApplicationDocument
  try{
    response = await $$createApplication(data,session)
  }catch(err){
    if(isMongoDuplicateError(err)){
      throw new NameAlreadyUsedError(data.name)
    }
    throw new Error(err)
  }
  return response
}

export const authApplication = async(data:CreateApplicationProps,session?: ClientSession,) : Promise<ApplicationDocument> =>{
  const application = await findApplicationByUsername(data.username)
  if(!await bcrypt.compare(data.password, application.password)){
    throw new InvalidPasswordError()
  }
  return application
}

export const getAppllicationsFromSubscriptionNames = async(subscriptionNames:ApplicationDocument['subscriptionName'][]):Promise<ApplicationDocument[]> =>{
  return findBySubscriptionNames(subscriptionNames)
}

export const deleteApplication = async(applicationId:ApplicationDocument['id']):Promise<void>=>{
  const application = await findApplicationById(applicationId)
  try{
    await deleteSubscription(application.subscriptionName)
  }catch(err){}
  await $$deleteApplication(application)
  return
}



