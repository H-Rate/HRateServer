import Joi from 'joi'

export type ObjectId = string
export type DateTime = string
export type Duration = number
export type Email = string
export type Url = string

export const ref = (ref: string): Joi.StringSchema =>
  Joi.string().meta({ _mongoose: { type: 'ObjectId', ref: ref } })

export enum Users {
  DEVICE = 'device',
  APP = 'application'
}

export const allUsers = [
  Users.DEVICE,
  Users.APP
] as const
