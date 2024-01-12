const { config } = require('dotenv')
const { connection } = require('./https')
const { TokenReseller } = require('./TokenReseller')
const { CronJob } = require('cron')
const { getWallet } = require('./utils')

config()

let tokenReseller
triggerReseller = async () => {
  if (!tokenReseller) {
    tokenReseller = new TokenReseller({
      connection,
      wallet: await getWallet(process.env.DEGEN_PRIV_KEY),
      httpUrl: 'http://localhost:3022',
      amtMultiplier: 2 / 3, // 66% to use in resell
    })
  }
  const { tokenBalances, ogCollection } =
    await tokenReseller.getBalancesAndValues()
  tokenReseller.sellCoins({ tokenBalances, ogCollection })
}

var job = new CronJob(
  '0 */2 * * * *',
  () => triggerReseller(),
  null,
  true,
  'Asia/Manila'
)
