const axios = require('axios')
const { config } = require('dotenv')

config()
const apiGemsUrl = 'https://multichain-api.birdeye.so/solana/gems'
const headersGems = {
  'Content-Type': 'application/json',
  'User-Agent': 'PostmanRuntime/7.33.0', // Add this line
  'Agent-Id': process.env.AGENT_ID,
  Accept: '*/*',
  'Content-Length': 90,
  Origin: 'https://birdeye.so',
  Referrer: 'https://birdeye.so',
  page: 'find_gems',
  Host: 'multichain-api.birdeye.so',
  // Add any other required headers here
}
const bodyGems = {
  sort_by: 'trendNo24h',
  sort_type: 'asc',
  offset: 0,
  limit: 45,
  query: [],
  export: false,
}

class BirdEye {
  fetchLatestGems30 = async () =>
    axios
      .post(apiGemsUrl, bodyGems, { headers: headersGems })
      .then((response) => {
        const gemsWithManyData = response.data.data
        return gemsWithManyData.items.map((x) => {
          return {
            token: x.address,
            liquidity: x.liquidity,
            icon: x.logoURI,
            mc: x.mc,
            name: x.name,
            price: x.price,
            symbol: x.symbol,
            decimals: x.decimals,
          }
        })
      })
      .catch((error) => {
        console.error('Request failed:', error)
        return null
      })
}

module.exports = { BirdEye }
