const { config } = require('dotenv')
const fetch = require('node-fetch')

config()

// Replace 'YOUR_BOT_TOKEN' and 'YOUR_CHAT_ID' with your actual bot token and chat ID.
const botToken = process.env.BOT_TOKEN // sample 6970412345:XXEuRMY_uCMCwOHUD2nYqM_YTrMNaRMR-GI
const chatId = process.env.CHAT_ID // sample 123337079

class Telegram {
  async sendMessage({ message, send = true }) {
    if (send) {
      const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      })

      const responseBody = await response.json()
      return 0
    }
  }
}

module.exports = { Telegram }
