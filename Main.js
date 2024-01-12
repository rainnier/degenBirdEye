const { BirdEye } = require('./BirdEye')
const { BuyerWallet } = require('./BuyerWallet')
const { Notifier } = require('./Notifier')
const { getWallet } = require('./utils')
const { config } = require('dotenv')
const { CronJob } = require('cron')
const { connection } = require('./https')

config()
class Subject {
  constructor() {
    this.observers = []
  }

  addObserver(observer) {
    this.observers.push(observer)
  }

  removeObserver(observer) {
    this.observers = this.observers.filter((obs) => obs !== observer)
  }

  notifyObservers(data) {
    this.observers.forEach((observer) => {
      observer.update(data)
    })
  }
}

async function updateCall() {
  const degenWal = await getWallet(process.env.DEGEN_PRIV_KEY)
  const degenWallet = new BuyerWallet({
    serverUrl: 'http://localhost:3022', // Use appropriate port
    wallet: degenWal,
    connection,
  })
  // Example usage
  const subject = new Subject()

  // Add the observer module to the subject
  subject.addObserver(degenWallet)

  const birdEye = new BirdEye()
  const latestGems = await birdEye.fetchLatestGems30()

  //BuyerWallet notifier
  subject.notifyObservers(latestGems)

  // Tg notifier
  const notifier = new Notifier()
  const previousGems = [
    ...(await degenWallet.ogLister.getAllOg()).data,
    ...(await degenWallet.ogLister.getAllNotInOg()).data,
  ]
  await notifier.notify({
    previousGems,
    latestGems,
  })
}

var job = new CronJob('0 */2 * * * *', updateCall, null, true, 'Asia/Manila')
