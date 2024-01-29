const { config } = require('dotenv')
const { Telegraf } = require('telegraf')
const { Telegram } = require('./Telegram')
const { Dexscreener } = require('./DexScreener')

config()
const botToken = process.env.BOT_TOKEN // Replace with your actual bot token
const groupId = +process.env.GROUP_CHAT_ID // Replace with the actual ID of the group

const bot = new Telegraf(botToken)
const tg = new Telegram()

class TgBuyDetector {
  constructor({ buyerWallet }) {
    this.buyerWallet = buyerWallet
  }
  launch = async () => {
    bot.on('text', async (ctx) => {
      console.log('enter1')
      // Check if the message is from the group
      console.log(`groupchat id: ${groupId}`)
      console.log(`ctx message chat id id: ${ctx.message.chat.id}`)
      console.log(`istrue? ${ctx.message.chat.id === groupId}`)
      if (ctx.message.chat.id === groupId) {
        const inputString = ctx.message.text

        // Use a regular expression to capture the right side
        const slackMatch = inputString.match(/degenBuy:\s*(.*)/)
        const rightSide = slackMatch ? slackMatch[1].trim() : null

        if (rightSide) {
          console.log(
            `Message from ${ctx.from.username} in group ${ctx.message.chat.title}: ${ctx.message.text}`
          )
          // Use a regular expression to extract the desired value
          const match = inputString.match(/degenBuy:\s*([^[\]]*)/)
          // Check if there is a match and get the extracted value
          const extractedValue = match ? match[1] : null

          const ca_length = 44
          const ca_length_2 = 43
          const dexScreenerStart = 'https://dexscreener.com/solana/'
          if (
            extractedValue == null ||
            extractedValue.trim() === '' ||
            extractedValue.length < ca_length_2 ||
            extractedValue.startsWith(dexScreenerStart)
          ) {
            if (
              extractedValue != null &&
              extractedValue.startsWith(dexScreenerStart)
            ) {
              // https://dexscreener.com/solana/
              const dexscreener = new Dexscreener()
              const ca = await dexscreener.getCaOfPair({
                address: extractedValue.substring(dexScreenerStart.length),
              })
              tg.sendMessage({
                message: `Seems to be buying with Dexscreener: ${extractedValue}\nGood, let's try bili using ca: ${ca}`,
              })
              this.buyerWallet.buyNewTrendingCoins([{ token: ca }])
            } else {
              tg.sendMessage({
                // degenBuy:[0x63B8D12543bc5F654606C6Eb6fCbbf4efbFdDAe6]
                message: `string length is: ${rightSide.length}\nBro fail yan malamang wallet address yan o sobrang link: ${rightSide}`,
              })
            }
          } else {
            // degenBuy:4cuT75m6yYxsxgwFCNttmmkqru3fdFKbcQYjthmec31T
            tg.sendMessage({
              message: `string length is: ${extractedValue.length}\nGood, let's try bili: ${extractedValue}`,
            })
            this.buyerWallet.buyNewTrendingCoins([{ token: extractedValue }])
          }
        }

        // Use a regular expression to extract the desired value
        const match = inputString.match(/clearDegen:\s*([^[\]]*)/)
        // Check if there is a match and get the extracted value
        const extractedValue = match ? match[1] : null

        if (extractedValue != null && extractedValue.trim() !== '') {
          // clearDegen:8sV46KEWWsQunkw6MDNeBHWwnk32DWv7583519GerRD9

          tg.sendMessage({
            message: `Clearing token: ${extractedValue}`,
          })
          try {
            const result = await this.buyerWallet.clearOg({
              token: extractedValue,
            })
            if (result) {
              tg.sendMessage({
                message: `Clear seems ok - you may now retrigger degenBuy`,
              })
            }
          } catch (error) {
            console.log('error', error)
            tg.sendMessage({
              message: `Cannot clear token: ${extractedValue} - might have clearance already\nYou may now try retriggering degenBuy`,
            })
          }
        }
      }
    })

    bot.launch().then(() => {
      console.log('Bot is running!')
    })
  }
}

module.exports = { TgBuyDetector }
