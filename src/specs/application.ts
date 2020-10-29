import Joi from 'joi'

export enum ApplicationDeviceTypes {
  windows = 'windows',
  linux = 'linux',
  mac = 'mac',
  ios = 'ios',
  android = 'android',
  web = 'web',
  other = 'other'
}

export const allApplicationDevices = [
  ApplicationDeviceTypes.windows,
  ApplicationDeviceTypes.linux,
  ApplicationDeviceTypes.mac,
  ApplicationDeviceTypes.ios,
  ApplicationDeviceTypes.android,
  ApplicationDeviceTypes.web,
  ApplicationDeviceTypes.other
]

export interface Application {
  username: string,
  password: string,
  name: string,
  subscriptionNames:string[],
  deviceType: ApplicationDeviceTypes,
}

export const ApplicationSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  name: Joi.string().required(),
  subscriptionNames: Joi.array().items(Joi.string()).required().default([]),
  deviceType: Joi.string().valid(...allApplicationDevices).required().default(ApplicationDeviceTypes.other)
})
