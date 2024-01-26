const { SPL_ACCOUNT_LAYOUT } = require('@raydium-io/raydium-sdk')
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
    const wsolAddress = await getAssociatedTokenAddress(
      new PublicKey(WSOL_MINT),
      this.wallet.publicKey
    )

    const lamports = await this.connection.getBalance(this.wallet.publicKey)
    const currentSol = lamports / LAMPORTS_PER_SOL

    let wsolAccount = await this.connection.getAccountInfo(wsolAddress)

    if (!wsolAccount) {
      await this.createWsolAssociatedTokenAddress({ wsolAddress })
    }

    // Check now if there is wsolAccount
    wsolAccount = await this.connection.getAccountInfo(wsolAddress)
    const accountInfo = SPL_ACCOUNT_LAYOUT.decode(wsolAccount.data)
    const wsol = accountInfo.amount.toNumber() / LAMPORTS_PER_SOL

    if (wsol < 0.01) {
      if (currentSol / 3 < amountIn) {
        amountIn = await this.getAmountIn(currentSol)
      }

      if (amountIn > 0) {
        await this.fundWsol({ wsolAddress, amountIn })
      } else {
        return null
      }
    }

    return wsolAccount
  }

  async getAmountIn(value) {
    // Check if the value is less than or equal to 0.02
    if (value <= 0.02) {
      return 0
    } else {
      // Calculate 1/3 of the value
      const oneThird = value / 3

      // Round to the nearest 0.01
      const roundedOneThird = Math.round(oneThird * 100) / 100

      // Check if the rounded value is less than 0.01
      if (roundedOneThird < 0.01) {
        return 0.01
      } else {
        return roundedOneThird.toFixed(2)
      }
    }
  }

  async createWsolAssociatedTokenAddress({ wsolAddress }) {
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

  async fundWsol({ wsolAddress, amountIn }) {
    console.log(`Funding wsol account: ${amountIn} or 1/3 of sol`)

    try {
      const transaction = new Transaction({
        feePayer: this.wallet.publicKey,
      })
      const instructions = []

      // fund sol to the account
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: this.wallet.publicKey,
          toPubkey: wsolAddress,
          lamports: (amountIn * LAMPORTS_PER_SOL).toFixed(0),
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
    } catch (error) {
      console.log(error)
    }
  }
}

module.exports = { WsolCreator }
