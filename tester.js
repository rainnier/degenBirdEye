const { config } = require('dotenv')
const { Jupiter } = require('./Jupiter')
const { PoolKey } = require('./PoolKeyNew')
const { getWallet } = require('./utils')
const { connection } = require('./https')

async function test(coin) {
  const poolKeys = await PoolKey.getPoolKeys(coin)
  console.log(poolKeys)
  // if (!poolKeys) {
  //   config()
  //   const jupiter = new Jupiter({
  //     connection,
  //     wallet: await getWallet(process.env.RAIN_PRIV_KEY),
  //   })
  //   jupiter.buyInJupiter({ toMintAddress: coin, amt: 0.001 })
  // }
}
//https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=DSYaufeAVsPDuH2r6s6Y5cwsJoc1eoqrpChySSyiB7RS&amount=10000000&slippageBps=1000

test(`RZRyr758BfvKcQTVp1XQoCe9BH2t724XQkLJkiikQ5f`)
