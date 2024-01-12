const axios = require('axios')
const { PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js')
const base58 = require('bs58')
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token')
const { Percent, WSOL } = require('@raydium-io/raydium-sdk')
const { Raydium } = require('./Raydium')
const { Jupiter } = require('./Jupiter')
const { PoolKey } = require('./PoolKeyNew')
const { AmtChecker } = require('./AmtChecker')
const { getHttp } = require('./https')
const { OgLister } = require('./OgLister')

const coinUrl = `https://token.jup.ag/all`
class TokenReseller {
  constructor({ connection, wallet, httpUrl, amtMultiplier }) {
    this.connection = connection
    this.wallet = wallet
    this.raydium = new Raydium({ connection, wallet })
    this.jupiter = new Jupiter({ connection, wallet })
    this.ogLister = new OgLister({ httpUrl })
    this.amtMultiplier = amtMultiplier
  }

  getTokenBalances = async () => {
    const { value: tokenAccounts } =
      await this.connection.getParsedTokenAccountsByOwner(
        this.wallet.publicKey,
        {
          programId: new PublicKey(TOKEN_PROGRAM_ID),
        }
      )
    return tokenAccounts
  }

  async sellIndividuallyInRaydium({ token, amt, symbol, slippagePercent }) {
    // console.log('address', token)
    const { status, txn } = await this.raydium.buyInRaydium({
      newCoinAddress: token,
      solToSwap: amt,
      outMintAddress: 'WSOL',
      slippagePercent,
      txnMode: 'SELL',
    })
    return {
      [token]: {
        sellStatus: status,
        sellTxn: txn,
        sellOrigin: 'Raydium',
        sellAmt: amt,
        sellCurrency: symbol,
        sellDate: new Date(),
      },
    }
  }

  async sellIndividuallyInJupiter({ token, amt, symbol, quoteResponse }) {
    const { status, txn } = await this.jupiter.processTransaction({
      quoteResponse,
    })
    return {
      [token]: {
        sellStatus: status,
        sellTxn: txn,
        sellOrigin: 'Jupiter',
        sellAmt: amt,
        sellCurrency: symbol,
        sellDate: new Date(),
      },
    }
  }

  async sellList(list, slippagePercent) {
    const txns = []
    for (let data of list) {
      const poolKeys = await PoolKey.getPoolKeys(data.token)
      if (poolKeys) {
        txns.push(
          this.sellIndividuallyInRaydium({
            token: data.token,
            amt: data.amt,
            symbol: data.symbol,
            slippagePercent,
          })
        )
      } else {
        txns.push(
          this.sellIndividuallyInJupiter({
            token: data.token,
            amt: data.amt,
            symbol: data.symbol,
            quoteResponse: data.quoteResponse,
          })
        )
      }
    }
    const results = await Promise.all(txns)
    const resultObject = results.reduce((acc, curr) => {
      const key = Object.keys(curr)[0]
      acc[key] = curr[key]
      return acc
    }, {})

    return resultObject
  }

  getBalancesAndValues = async () => {
    try {
      const rawTokenBalances = await this.getTokenBalances()

      const ogCollection = (await this.ogLister.getNotBalikTayaOg()).data
      // Convert ogCollection to an object for efficient lookups
      const ogCollectionLookup = ogCollection.reduce((acc, obj) => {
        // Check if balikTaya exists and is explicitly false
        acc[obj.token] = {
          balikTayaProp:
            obj.hasOwnProperty('balikTaya') && obj.balikTaya === false,
          symbol: obj.symbol,
        }
        return acc
      }, {})

      // Filter tokenBalances based on conditions
      const tokenBalances = rawTokenBalances
        .filter((token) => {
          // console.log(token.account.data.parsed.info.min)
          const address = token.account.data.parsed.info.mint

          // Check if address is in ogCollectionLookup and balikTaya is explicitly set to false
          return (
            ogCollectionLookup.hasOwnProperty(address) &&
            ogCollectionLookup[address]['balikTayaProp']
          )
        })
        .map((token) => {
          const address = token.account.data.parsed.info.mint
          token.account.data.parsed.info.symbol =
            ogCollectionLookup[address]['symbol']
          return token
        })

      return { tokenBalances, ogCollection }
    } catch (error) {
      console.error('Error:', error.message || error)
      console.log(error)
      return
    }
  }

  sellCoins = async ({ tokenBalances, ogCollection }) => {
    try {
      const raydiumSellList = []
      const jupiterSellList = []
      const newList = []
      const slippagePercent = 10
      const slippage = new Percent(slippagePercent, 100)
      for (const [index, { account }] of tokenBalances.entries()) {
        const {
          data: {
            parsed: {
              info: { mint, symbol },
              info: {
                tokenAmount: { uiAmount, decimals },
              },
            },
          },
        } = account

        const poolKeys = await PoolKey.getPoolKeys(mint)
        let valueInSol = 0
        let flag = ''
        const amountToSwap = uiAmount * this.amtMultiplier

        if (poolKeys) {
          flag += 'Raydium-'
          const { amountInRaw, amountOutRaw } =
            await AmtChecker.computeMinimumAmountWithSlippage({
              connection: this.connection,
              poolKeys,
              inMintToSwap: amountToSwap,
              slippage,
              txnMode: 'SELL',
            })
          valueInSol = amountOutRaw.numerator / amountOutRaw.denominator
          if (valueInSol >= 0.0123) {
            flag = '*** ' + flag
            newList.push(ogCollection.find((x) => x.token === mint))
            raydiumSellList.push({ token: mint, symbol, amt: amountToSwap })
          }
          console.log(
            `${flag}${symbol} (${mint}): ${amountToSwap} ${symbol} ≈ ${valueInSol} SOL`
          )
        } else {
          flag += 'Jupiter-'
          const quoteResponse = await Jupiter.getQuote({
            fromMintDecimals: decimals,
            fromMintAddress: mint,
            toMintAddress: WSOL.mint,
            amount: amountToSwap,
            slippageBps: slippagePercent * 100,
          })
          valueInSol = quoteResponse.otherAmountThreshold / LAMPORTS_PER_SOL
          if (quoteResponse.otherAmountThreshold >= 0.0123 * LAMPORTS_PER_SOL) {
            flag = '*** ' + flag
            newList.push(ogCollection.find((x) => x.token === mint))
            jupiterSellList.push({
              token: mint,
              symbol,
              amt: amountToSwap,
              quoteResponse,
            })
          }
          console.log(
            `${flag}${symbol} (${mint}): ${amountToSwap} ${symbol} ≈ ${valueInSol} SOL`
          )
        }
      }
      const sellList = [...jupiterSellList, ...raydiumSellList]
      if (sellList.length > 0) {
        console.log(`selling...`)

        const sellResults = await this.sellList(sellList, slippagePercent)

        const updataResults = newList.map((x) => {
          const additionalData = sellResults[x.token]
          if (additionalData) {
            return {
              ...x,
              ...additionalData,
              mode: 'SELL',
              balikTaya: additionalData.sellStatus === 'SUCCESS',
            }
          }
        })

        this.updateOgWithSells(updataResults)
      } else {
        console.log(`Nothing to sell`)
      }
    } catch (error) {
      console.error('Error:', error.message || error)
      console.log(error)
    }
  }

  updateOgWithSells = async (dataArray) => {
    if (dataArray) {
      for (const dataObject of dataArray) {
        try {
          const { token, ...restData } = dataObject
          await this.ogLister.updateOg(token, restData)
        } catch (error) {
          console.error('Error adding document:', error)
        }
      }
    }
  }
}

module.exports = { TokenReseller }
