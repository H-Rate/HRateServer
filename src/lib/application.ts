export {createApplicationProps, updateApplicationProps,findApplicationById} from '../db/ops/application'
import type { ApplicationDocument } from 'db/models'
import {createApplication as $$createApplication,CreateApplicationProps, findApplicationByUsername} from '../db/ops/application'
import type { ClientSession } from 'mongoose'
import bcrypt from 'bcrypt'
import { isMongoDuplicateError } from '../db/models/_util'
import {NameAlreadyUsedError,InvalidPasswordError} from './errors'


const SALT_WORK_FACTOR = 10;


export const createApplication = async(data:CreateApplicationProps,session?: ClientSession,) : Promise<ApplicationDocument> =>{
  data.password = await bcrypt.hash(data.password,SALT_WORK_FACTOR)
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



