import { ApplicationDocument, ApplicationModel } from '../models'
import type { Application } from '../../specs/application'
import * as _ from 'lodash'
import type { SaveOptions } from 'mongoose'
import make, { FindOptions } from './make'
import type { Optional, Required } from 'utility-types'
import { Subscription } from '@google-cloud/pubsub'

export const createApplicationProps = [
  'username','password','name','deviceType'
] as const

export const updateApplicationProps = ['username','name','password','subscriptionNames'] as const

export type CreateApplicationProps = Optional<
  Pick<Required<Application>, typeof createApplicationProps[number]>
>
export type UpdateApplicationProps = Partial<
  Pick<Application, typeof updateApplicationProps[number]>
>

const ops = make(ApplicationModel, {
  create: createApplicationProps,
  update: updateApplicationProps,
})

export const createApplication = async (
  data: CreateApplicationProps,
  { session }: SaveOptions = {},
): Promise<ApplicationDocument> => {
  return ops.create({ session }, data)
}

export const findApplicationById = async (
  id: ApplicationDocument['id'],
  options: FindOptions = {},
): Promise<ApplicationDocument | null> => {
  return ops.findById({}, id, options)
}

export const findApplicationByUsername = async (
  username: ApplicationDocument['username'],
  options: FindOptions = {},
): Promise<ApplicationDocument | null> => {
  return ops.findOne({}, {username}, options)
}

export const updateApplication = async (
  doc: ApplicationDocument,
  data: UpdateApplicationProps,
): Promise<ApplicationDocument | null> => {
  return ops.update({},doc,data)
}

export const findBySubscriptionNames = async (
  subscriptionNames:ApplicationDocument['SubscriptionName']
): Promise<ApplicationDocument[]> =>{
  const res =  await ops.find({},{subscriptionNames:{$in:subscriptionNames}},{select:'name subscriptionNames'})
  return res.map(a=> {return {id:a.id, name:a.name,subscriptionNames: _.intersection(a.subscriptionNames,subscriptionNames)}} )
}


export const deleteApplication = async (
  doc:ApplicationDocument
): Promise<ApplicationDocument[]> =>{
  return ops.delete({},doc)
}
