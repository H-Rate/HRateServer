import { ObjectID } from 'mongodb'
import _ from 'lodash'

export const objectIdOrNull = fn => id => {
  if (!ObjectID.isValid(id)) {
    return null
  }

  return fn(id)
}

export const fetchPopulators = (
  populator: Record<string, unknown>[],
  query: { populate?: string },
): Record<string, unknown>[] => {
  return _.flatten(query.populate?.split(',').map(q => populator.filter(p => p.path === q)))
}
