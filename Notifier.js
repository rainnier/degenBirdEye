const { Helper } = require('./Helper.js')
const { Telegram } = require('./Telegram.js')

const dataMessage = `<b>Ako ay tao! - birdeye</b>`

class Notifier {
  constructor(dataMessage) {
    this.dataMessage = dataMessage
    this.telegram = new Telegram()
  }

  async notify({ previousGems, latestGems }) {
    const newArray = Helper.getDiscoveredGems({
      previousGems,
      latestGems,
    })
    if (previousGems.length == 0) {
      // Print all tokens initially
      this.notifyTgOnInitialGems(newArray)
    } else if (newArray.length > 0) {
      this.notifyTgOnNewGems(previousGems, newArray)
    }
  }
  async notifyTgOnInitialGems(newArray) {
    let startMsg = ''
    const start10 = newArray
    await start10.map((x) => {
      startMsg += `<b>${x.symbol}</b> - https://birdeye.so/token/${x.token}?chain=solana\n`
      return x
    })

    await this.telegram.sendMessage({
      message: `Starting tokens:\n ${startMsg}`,
    })
  }

  async notifyTgOnNewGems(previousTop10, newArray) {
    if (newArray && newArray.length > 0) {
      await this.telegram.sendMessage({
        message: 'start of birdeye top10 --------------------',
      })

      await this.telegram.sendMessage({
        // message: `Matatag tokens:\n ${previousTop10.map((x) => x.symbol)}`,
        message: `Matatag tokens:\n ${previousTop10.length}`,
      })

      await Promise.all(
        newArray.map((x) =>
          this.telegram.sendMessage({
            message: `${dataMessage}\n<b>incoming - ${x.symbol}\ntoken: ${x.token}\nRadium link: https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${x.token}</b>\nhttps://birdeye.so/token/${x.token}?chain=solana`,
          })
        )
      )

      await this.telegram.sendMessage({
        message: 'end of birdeye top10 --------------------',
      })
    }
  }
}

module.exports = { Notifier }
