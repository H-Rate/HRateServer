import config from 'config'
import type { Middleware } from 'koa-jwt'
import jwt from 'koa-jwt'
import { findApplicationById } from '../lib/application'
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
        case 'application':
          const app = await findApplicationById(data['sub'])
          return app ? false : true
        default:
          return true
      }
    },
  })
}
