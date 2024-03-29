const { BirdEye } = require('./BirdEye')
const { BuyerWallet } = require('./BuyerWallet')
const { Notifier } = require('./Notifier')
const { getWallet } = require('./utils')
const { config } = require('dotenv')
const { CronJob } = require('cron')
const { connection } = require('./https')
const { TgBuyDetector } = require('./TgBuyDetector')
const { Telegram } = require('./Telegram')

config()
const tg = new Telegram()
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

let degenWallet
let subject
let birdEye
let notifier

async function initDegenVariables() {
  const degenWal = await getWallet(process.env.DEGEN_PRIV_KEY)
  degenWallet = new BuyerWallet({
    serverUrl: 'http://localhost:3022', // Use appropriate port
    wallet: degenWal,
    connection,
    amtToBuy: 0.02,
    notify: (msg) => {
      tg.sendMessage({ message: msg })
    },
    notifySuccess: (msg) => {
      tg.sendMessage({ message: msg })
    },
    notifySuccessAppender: () => {
      return `This txn is from birdEye(positive), if txn is not successful MUST ONLY clear og using clearDegen:token\nbirdEye scan will pick this up again`
    },
    notifyFailAppender: () => {
      // return `This txn is from birdEye(negative), if txn is not successful nothing to do - birdEye scan will pick this up again`
      return ``
    },
  })
  // Example usage
  subject = new Subject()
  // Add the observer module to the subject
  subject.addObserver(degenWallet)

  birdEye = new BirdEye()
  notifier = new Notifier()
}

async function updateCall() {
  const latestGems = await birdEye.fetchLatestGems30()

  //BuyerWallet notifier
  subject.notifyObservers(latestGems)

  // Tg notifier

  const previousGems = [
    ...(await degenWallet.ogLister.getAllOg()).data,
    ...(await degenWallet.ogLister.getAllNotInOg()).data,
  ]
  await notifier.notify({
    previousGems,
    latestGems,
  })
}

async function launchTgBuyDetector() {
  console.log(`Launching TgBuyDetector`)
  const degenWalTg = await getWallet(process.env.DEGEN_TG_PRIV_KEY)
  const degenWalletTg = new BuyerWallet({
    serverUrl: 'http://localhost:3022', // Use appropriate port
    wallet: degenWalTg,
    connection,
    amtToBuy: 0.02,
    notifySuccess: (msg) => {
      tg.sendMessage({ message: msg })
    },
    notifyFail: (msg) => {
      tg.sendMessage({ message: msg })
    },
    notifySuccessAppender: () => {
      return `This txn is from degen trigger(positive), if txn is not successfull MUST BOTH clear og first using clearDegen:token\nAND retrigger using degenBuy:token`
    },
    notifyFailAppender: () => {
      return `This txn is from degen trigger(negative), if txn is not successfull JUST retrigger using degenBuy:token`
    },
    notifyNoOgFound: (msg) => {
      tg.sendMessage({
        message: msg,
      })
    },
    buyerType: 'dexScreener',
  })

  const tgBuyDetector = new TgBuyDetector({ buyerWallet: degenWalletTg })
  tgBuyDetector.launch()
}

initDegenVariables()
launchTgBuyDetector()

//var job = new CronJob('0 */2 * * * *', updateCall, null, true, 'Asia/Manila')
