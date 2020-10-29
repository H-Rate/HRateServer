import * as cron from 'cron'
import {resetExpiredTokens} from './lib/device'

var minuteWorker = new cron.CronJob('* * * * *', () => {
  resetExpiredTokens()
}, null, true, 'America/Los_Angeles');

export const startCronWorkers = async() =>{
  minuteWorker.start()
  return
}
