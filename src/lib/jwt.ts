import config from 'config'
import jwt from 'jsonwebtoken'
import type { ApplicationDocument, DeviceDocument } from '../db/models'
import type {Users} from '../specs/common'


export type JWTPayload = {
  user: {
    type: string
  }
  iat: number
}

const createPayload = (type:Users): JWTPayload => ({
  user: {type},
  iat: Date.now(), // issued at
})

const createJwtImpl = (
  payload: JWTPayload,
  userId: DeviceDocument['id'] | ApplicationDocument['id'],
  jwtid: string,
): string => {
  const expiresIn = config.get('jwt.expiresIn') as number
  return jwt.sign(payload, config.get('jwt.secret'), {
    expiresIn: Date.now() + expiresIn,
    subject: userId.toString(),
    jwtid,
  })
}

export const createJwt = (user: DeviceDocument | ApplicationDocument,type:Users,jwtid: string): string => {
  return createJwtImpl(createPayload(type), user.id, jwtid)
}
