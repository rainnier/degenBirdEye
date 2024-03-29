const { Wallet } = require('@project-serum/anchor')
const { Keypair } = require('@solana/web3.js')
const base58 = require('bs58')

const getWallet = async (privateKey) => {
  const wallet = new Wallet(
    Keypair.fromSecretKey(base58.decode(privateKey) || '')
  )
  return wallet
}
const getWalletBase58 = async (privateKey) => {
  const wallet = new Wallet(
    Keypair.fromSecretKey(Buffer.from(privateKey) || '')
  )
  return wallet
}

module.exports = { getWallet, getWalletBase58 }
