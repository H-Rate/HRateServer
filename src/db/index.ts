import config from 'config'
import { connect as redisConnect, disconnect as redisDisconnect } from './redis'

export const connect = async (): Promise<void> => {
  await Promise.all([redisConnect()])
}

export const disconnect = async (): Promise<void> => {
  await Promise.all([redisDisconnect()])
}
