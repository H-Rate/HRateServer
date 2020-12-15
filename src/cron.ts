import { clearDisconnecedClients } from './db/ops/client'
var CronJob = require('cron').CronJob

const minuteManager = async () => {
  await clearDisconnecedClients()
}

const minuteWorker = new CronJob('* * * * *', minuteManager)

export const startCron = (): void => {
  minuteWorker.start()
}

export const stopCron = (): void => {
  minuteWorker.stop()
}
