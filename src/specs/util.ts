import Joi from 'joi'

export const pickSchema = <T>(
  keys: readonly string[],
  schema: Joi.ObjectSchema<T>,
): Joi.ObjectSchema<Partial<T>> => {
  const sub = keys.reduce((acc, key) => {
    acc[key] = schema.extract(key)
    return acc
  }, {} as Record<string, Joi.Schema>)
  return Joi.object(sub)
}

export const markAsRequired = <T>(
  keys: readonly string[],
  schema: Joi.ObjectSchema<T>,
): Joi.ObjectSchema<T> => {
  return schema.fork(keys as string[], s => s.required())
}

export const markAsOptional = <T>(
  keys: readonly string[],
  schema: Joi.ObjectSchema<T>,
): Joi.ObjectSchema<T> => {
  return schema.fork(keys as string[], s => s.allow(null).optional())
}

export const forkWith = <T>(
  schema: Joi.ObjectSchema<T>,
  keys: readonly string[],
  optional: readonly string[] = [],
): Joi.ObjectSchema<Partial<T>> => {
  const o = new Set(optional)
  return Joi.object(
    keys.reduce((acc, key) => {
      const k = schema.extract(key)
      acc[key] = o.has(key) ? k.allow(null).optional() : k.required()
      return acc
    }, {} as Record<string, Joi.Schema>),
  )
}
