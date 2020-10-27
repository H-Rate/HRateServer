import config from 'config'
import jwt from 'jsonwebtoken'
import type { DeviceDocument } from '../db/models'

export type JWTPayload = {
  user: {
    type: string
  }
  iat: number
}

const createPayload = (user: DeviceDocument): JWTPayload => ({
  user: {
    type: 'device',
  },
  iat: Date.now(), // issued at
})

const createJwtImpl = (
  payload: JWTPayload,
  userId: DeviceDocument['id'],
  jwtid: string,
): string => {
  const expiresIn = config.get('jwt.expiresIn') as number
  return jwt.sign(payload, config.get('jwt.secret'), {
    expiresIn: Date.now() + expiresIn,
    subject: userId.toString(),
    jwtid,
  })
}

export const createJwt = (user: DeviceDocument, jwtid: string): string => {
  return createJwtImpl(createPayload(user), user.id, jwtid)
}
