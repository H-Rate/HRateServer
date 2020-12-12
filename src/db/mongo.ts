import type { TransactionOptions } from 'mongodb'
import mongoose, { ClientSession } from 'mongoose'
import logger from '../util/logger'

export const connect = async (uri: string): Promise<void> => {
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
    autoCreate: true,
  })
}

export const disconnect = (): Promise<void> => mongoose.disconnect()

export const connected = (): boolean => {
  return mongoose.connection.readyState == 0 ? false : true
}

const transactionOptions: TransactionOptions = {
  readPreference: 'primary',
  readConcern: { level: 'local' },
  writeConcern: { w: 'majority' },
} as const

export const withTransaction = async <R>(
  func: (session: ClientSession) => Promise<R>,
  session?: ClientSession,
): Promise<R> => {
  // FIXME: transaction is being aborting
  return func(null)

  if (session) {
    return func(session)
  }

  session = await mongoose.startSession()
  try {
    return new Promise<R>((resolve, reject) => {
      const run = () => func(session).then(resolve, reject)
      session.withTransaction(run, transactionOptions).catch(err => logger.error(err))
    })
  } finally {
    session.endSession()
  }
}
