// https://api.dexscreener.com/latest/dex/pairs/solana/ashtjfs76nuamqfci2xzholxk2v31buswdhzut3bvbif
// https://dexscreener.com/solana/hjg7v9p69cyaiid6kmdbtjfusvsmu9vpamtiedduthte

const { getHttp } = require('./https')

class Dexscreener {
  constructor() {
    this.http = getHttp({
      httpUrl: 'https://api.dexscreener.com/latest/dex/pairs/solana',
    })
  }

  async getCaOfPair({ address }) {
    const { data } = await this.http.get(`/${address}`)
    if (data.pair) {
      return data.pair.baseToken.address
    } else {
      return address
    }
  }
}

module.exports = { Dexscreener }
