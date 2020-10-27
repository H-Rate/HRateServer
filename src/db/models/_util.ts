import type { MongoError } from 'mongodb'
import type { Document as MongoDocument } from 'mongoose'
import MongooseValidationError from 'mongoose/lib/error/validation'

const MongoDuplicateErrorCode = 11000

export const isMongoDuplicateError = (error: MongoError): boolean => {
  return error.code === MongoDuplicateErrorCode
}

export const isMongoValidationError = <E extends Error>(
  error: E,
): error is MongooseValidationError => {
  return error instanceof MongooseValidationError
}

export type WithTimestamps = {
  createdAt: string
  updatedAt: string
}

export type Document<T> = MongoDocument & WithTimestamps & T
