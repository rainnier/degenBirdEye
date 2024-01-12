const { jsonInfo2PoolKeys, WSOL } = require('@raydium-io/raydium-sdk')
const axios = require('axios')

const serverUrl = 'http://localhost:3000'
// 'https://api.raydium.io/v2/sdk/liquidity/mainnet.json'

class PoolKey {
  static async getCoinPoolKey(mode, coin_mint, outMintAddress = 'WSOL') {
    const mint = outMintAddress === 'WSOL' ? WSOL.mint : outMintAddress
    return axios
      .get(`${serverUrl}/${mode}?baseMint=${coin_mint}`)
      .then((response) => {
        return response.data.find((pool) => pool.quoteMint === mint)
      })
      .catch((error) => {
        console.error('Error fetching pool key:', error)
      })
  }

  static async getPoolKeys(coin_mint, outMintAddress = 'WSOL') {
    let poolKey = await this.getCoinPoolKey(
      'unOfficial',
      coin_mint,
      outMintAddress
    )
    if (!poolKey) {
      poolKey = await this.getCoinPoolKey('official', coin_mint, outMintAddress)
      return jsonInfo2PoolKeys(poolKey)
    }
    return jsonInfo2PoolKeys(poolKey)
  }
}

module.exports = { PoolKey }
