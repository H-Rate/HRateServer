import config from 'config'
import type { Middleware } from 'koa-jwt'
import jwt from 'koa-jwt'
import { findDeviceById } from '../lib/device'


export default (): Middleware => {
  return jwt({
    secret: config.get('jwt.secret'),
    async isRevoked(_, data) {
      if (data['exp'] < Date.now()) {
        return true
      }

      switch(data['user'].type){
        case 'device':
          const device = await findDeviceById(data['sub'])
          return device ? false : true
        default:
          return true
      }
    },
  })
}
