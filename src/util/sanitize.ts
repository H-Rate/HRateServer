import { isEmpty, isFunction, isPlainObject, isString, mapKeys, mapValues, set, keys } from 'lodash'
import mongoose from 'mongoose'

export type Prop = string | readonly [string, Props]
export type Props = ReadonlyArray<Prop>

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>
}

export type KeyMapping = Record<string, string>

const predefKeys: KeyMapping = { _id: 'id', __v: 'versionKey' }
const renameKeys = (mapping: KeyMapping) => (_, k) => mapping[k] || k

const isModel = (obj): boolean => {
  obj = obj || {}
  return obj.prototype instanceof mongoose.Model
}

export const toPlainData = (o: unknown): unknown => {
  if (isModel(o)) {
    // mongoose.Model
    return toPlainData(mapKeys((o as any).toObject({ versionKey: false }), renameKeys(predefKeys)))
  } else if (isFunction((o as any)?.toHexString)) {
    // bson.ObjectId
    return (o as any).toHexString()
  } else if (Array.isArray(o)) {
    return o.map(toPlainData)
  } else if (o instanceof Date) {
    return o.toISOString()
  } else if (isPlainObject(o)) {
    o = mapKeys(o as any, renameKeys(predefKeys))
    return mapValues(o as Record<string, unknown>, toPlainData)
  } else if (typeof o === 'object' && o != null) {
    return toPlainData(mapKeys((o as any).toJSON(), renameKeys(predefKeys)))
  }
  return o
}

export const sanitize = <T>(props: Props, object: T): RecursivePartial<T> => {
  if (isEmpty(props)) {
    return object
  }
  if (Array.isArray(object)) {
    return object.map(elem => sanitize(props, elem))
  }

  return props.reduce((acc, prop) => {
    if (isString(prop)) {
      return set(acc, prop, object?.[prop as any])
    }

    const [key, nested] = prop
    return set(acc, key, sanitize(nested as any, object?.[key as any]))
  }, {})
}
