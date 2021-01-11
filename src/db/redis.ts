import config from 'config'
import asyncRedis from 'async-redis'

export let redisClient: asyncRedis.RedisClient = null

export const getClient = (): asyncRedis.RedisClient => {
  return redisClient
}

export const setClient = (client: asyncRedis.RedisClient): void => {
  redisClient = client
}

export const connect = async (): Promise<asyncRedis.RedisClient> => {
  const redisClient = getClient()
  if (!redisClient) {
    setClient(asyncRedis.createClient(config.get('redis.uri')))
  }
  return getClient()
}

export const disconnect = async (): Promise<void> => {
  await redisClient.quit()
  redisClient = null
}

export const setObject = async (key: string, value: Record<string, unknown>): Promise<void> => {
  await redisClient.set(key, JSON.stringify(value))
}

export const setString = async (key: string, value: string): Promise<void> => {
  await redisClient.set(key, value)
}

export const getObject = async (key: string): Promise<Record<string, unknown> | undefined> => {
  const value = await redisClient.get(key)
  console.log("get object: ", key, value)
  if (value === null) return undefined
  try {
    const jsonValue = JSON.parse(value)
    return jsonValue
  } catch {
    return undefined
  }
}

export const getString = async (key: string): Promise<string> => {
  const value = await redisClient.get(key)
  console.log("get string: ", key, value)
  if (value === null) return undefined
  return value
}

export const expire = async (key: string, seconds: number): Promise<void> => {
  await redisClient.expire(key, seconds)
  return
}

export const deleteKey = async (key: string): Promise<void> => {
  await redisClient.del(key)
  return
}

export const existsKey = async (key: string): Promise<boolean> => {
  return redisClient.exists(key)
}

export const scanKey = async (pattern: string): Promise<string[]> => {
  let cursor = '0'
  let data = []
  while (1) {
    const results = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 10)
    cursor = results[0]
    if (cursor === '0') break
    data.push(...results[1])
  }
  return data
}

export const connected = async (): Promise<boolean> => {
  const response = await redisClient.ping()
  return response === 'PONG' ? true : false
}
