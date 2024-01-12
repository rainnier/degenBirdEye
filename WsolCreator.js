const {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
} = require('@solana/spl-token')
const {
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  SystemProgram,
} = require('@solana/web3.js')

const WSOL_MINT = 'So11111111111111111111111111111111111111112'

class WsolCreator {
  constructor({ connection, wallet }) {
    this.connection = connection
    this.wallet = wallet
  }
  async getOrCreateWsolAccount(amountIn) {
    console.log(this.wallet.publicKey)
    const wsolAddress = await getAssociatedTokenAddress(
      new PublicKey(WSOL_MINT),
      this.wallet.publicKey
    )

    console.log('wsolAddress', wsolAddress.toBase58())

    const wsolAccount = await this.connection.getAccountInfo(wsolAddress)

    if (!wsolAccount) {
      console.log('Creating wsol account')
      const transaction = new Transaction({
        feePayer: this.wallet.publicKey,
      })
      const instructions = []

      instructions.push(
        createAssociatedTokenAccountInstruction(
          this.wallet.publicKey,
          wsolAddress,
          this.wallet.publicKey,
          new PublicKey(WSOL_MINT)
        )
      )

      // fund sol to the account
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: this.wallet.publicKey,
          toPubkey: wsolAddress,
          lamports: amountIn * LAMPORTS_PER_SOL,
        })
      )

      instructions.push(
        // This is not exposed by the types, but indeed it exists
        createSyncNativeInstruction(wsolAddress)
      )

      transaction.add(...instructions)
      transaction.recentBlockhash = (
        await this.connection.getLatestBlockhash()
      ).blockhash
      transaction.partialSign(this.wallet.payer)
      const result = await this.connection.sendTransaction(transaction, [
        this.wallet.payer,
      ])
      console.log({ result })
    }

    return wsolAccount
  }
}

module.exports = { WsolCreator }
