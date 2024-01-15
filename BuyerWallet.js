const { Raydium } = require('./Raydium.js')
const { Helper } = require('./Helper.js')
const { Jupiter } = require('./Jupiter.js')
const { OgLister } = require('./OgLister.js')
const { PoolKey } = require('./PoolKeyNew.js')

class BuyerWallet {
  constructor({ serverUrl, wallet, connection, amtToBuy = 0.01 }) {
    this.wallet = wallet
    this.connection = connection
    this.amtToBuy = amtToBuy
    this.raydium = new Raydium({ connection, wallet })
    this.jupiter = new Jupiter({ connection, wallet })
    this.ogLister = new OgLister({ httpUrl: serverUrl })
  }

  async update(data) {
    await this.buyNewTrendingCoins(data)
  }

  async addDocuments(dataArray) {
    if (dataArray) {
      for (const dataObject of dataArray) {
        try {
          if (dataObject.status === 'SUCCESS') {
            await this.ogLister.addOg(dataObject)
          } else if (dataObject.status === 'FAIL_NO_POOL_KEYS') {
            if (
              (await this.ogLister.getCoinNotInOgCollection(dataObject.token))
                .data.length > 0
            ) {
              // Do not add if already found in ogNotInList
              console.log(`Not adding ${dataObject.token}`)
            } else {
              console.log(`Adding ${dataObject.token}`)
              // await this.ogLister.addOgToNotInList(dataObject) - no longer add to ogNotInList to avoid save conflict
              // also add to collection but no balikTaya key so it will not be picked up
              await this.ogLister.addOg(dataObject)
            }
          } else if (dataObject.status === 'FAIL') {
            if (
              (await this.ogLister.getCoinNotInOgCollection(dataObject.token))
                .data.length > 0
            ) {
              // Do not add if already failed first attempt and already added in ogNotInList
              console.log(`Not adding ${dataObject.token}`)
            } else {
              console.log(`Adding ${dataObject.token}`)
              await this.ogLister.addOgToNotInList(dataObject)
            }
          }
        } catch (error) {
          console.error('Error adding document:', error)
        }
      }
    }
  }
  async buyIndividuallyInRaydium(token, amountToBuy, symbol) {
    const { status, txn } = await this.raydium.buyInRaydium({
      newCoinAddress: token,
      solToSwap: amountToBuy,
    })
    return {
      [token]: {
        status,
        txn,
        buyOrigin: 'Raydium',
        buyAmt: amountToBuy,
        buyCurrency: symbol,
      },
    }
  }
  async buyIndividuallyInJupiter(token, amountToBuy, symbol) {
    const { status, txn } = await this.jupiter.buyInJupiter({
      toMintAddress: token,
      amt: amountToBuy,
    })
    return {
      [token]: {
        status,
        txn,
        buyOrigin: 'Jupiter',
        buyAmt: amountToBuy,
        buyCurrency: symbol,
      },
    }
  }
  async buyList(ogListToBuy, amountToBuy, symbol) {
    const buyTxns = []
    for (const data of ogListToBuy) {
      const poolKeys = await PoolKey.getPoolKeys(data.token)
      if (poolKeys) {
        buyTxns.push(
          this.buyIndividuallyInRaydium(data.token, amountToBuy, symbol)
        )
      } else {
        buyTxns.push(
          this.buyIndividuallyInJupiter(data.token, amountToBuy, symbol)
        )
      }
    }
    const buyResults = await Promise.all(buyTxns)
    const resultObject = buyResults.reduce((acc, curr) => {
      const key = Object.keys(curr)[0]
      acc[key] = curr[key]
      return acc
    }, {})

    return resultObject
  }

  async buyNewTrendingCoins(latestGems) {
    console.log('start buyTrendingCoins')
    try {
      const { data } = await this.ogLister.getAllOg()
      const newList = Helper.getDiscoveredGems({
        previousGems: data,
        latestGems,
      })

      if (newList.length > 0) {
        const buyResults = await this.buyList(newList, this.amtToBuy, 'WSOL')

        const updateList = await newList.map((x) => {
          const additionalData = buyResults[x.token]
          if (additionalData.status === 'SUCCESS') {
            return {
              ...x,
              ...additionalData,
              mode: 'BUY',
              bought: new Date(),
              balikTaya: false,
            }
          } else {
            return {
              ...x,
              ...additionalData,
              mode: 'BUY',
              bought: new Date(),
            }
          }
        })
        await this.addDocuments(updateList)
      } else {
        console.log('No new Og List')
      }
    } catch (error) {
      console.error('Error getting document:', error)
    }
  }
}
module.exports = { BuyerWallet }
