const { Connection } = require('@solana/web3.js')
const { default: axios } = require('axios')
const { config } = require('dotenv')

config()

const getHttp = ({ httpUrl }) =>
  axios.create({
    baseURL: httpUrl,
  })

const connection = new Connection(
  `https://rpc.helius.xyz/?api-key=${process.env.HELIUS_API_KEY}`
)

module.exports = { connection, getHttp }
