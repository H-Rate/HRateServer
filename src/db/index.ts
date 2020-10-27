import config from 'config'
import { connect as mongoConnect, disconnect as mongoDisconnect } from './mongo'

export const connect = async (): Promise<void> => {
  await mongoConnect(config.get('mongo.uri'))
}

export const disconnect = async (): Promise<void> => {
  await mongoDisconnect()
}
