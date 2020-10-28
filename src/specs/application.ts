import Joi from 'joi'

export interface Application {
  username: string,
  password: string,
  name: string,
}

export const ApplicationSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  name: Joi.string().required(),
})
