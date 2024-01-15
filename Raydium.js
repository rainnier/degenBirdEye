const {
  Liquidity,
  Percent,
  SPL_ACCOUNT_LAYOUT,
} = require('@raydium-io/raydium-sdk')
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token')
const { Transaction } = require('@solana/web3.js')
const { PoolKey } = require('./PoolKeyNew.js')
const { AmtChecker } = require('./AmtChecker.js')

class Raydium {
  constructor({ connection, wallet }) {
    this.connection = connection
    this.wallet = wallet
  }

  buyInRaydium = async ({
    newCoinAddress,
    solToSwap = 0.01,
    outMintAddress = 'WSOL',
    slippagePercent = 10,
    txnMode = 'BUY',
  }) => {
    try {
      const getTokenAccounts = async () => {
        const tokenResp = await this.connection.getTokenAccountsByOwner(
          this.wallet.publicKey,
          {
            programId: TOKEN_PROGRAM_ID,
          }
        )

        const accounts = []
        for (const { pubkey, account } of tokenResp.value) {
          accounts.push({
            pubkey,
            accountInfo: SPL_ACCOUNT_LAYOUT.decode(account.data),
          })
        }

        return accounts
      }

      const tokenAccounts = await getTokenAccounts()
      console.log('starting pool keys')
      const poolKeys = await PoolKey.getPoolKeys(newCoinAddress, outMintAddress)
      console.log(
        poolKeys
          ? 'Successful retrieval of poolkeys'
          : `Cannot get poolkeys for ${newCoinAddress}`
      )
      if (!poolKeys) {
        return {
          status: 'FAIL_NO_POOL_KEYS',
          txn: `No poolkeys for ${newCoinAddress}`,
        }
      }
      console.log('end pool keys')

      // Fetch the pool information
      const slippage = new Percent(slippagePercent, 100)
      const { amountInRaw, amountOutRaw } =
        await AmtChecker.computeMinimumAmountWithSlippage({
          connection: this.connection,
          poolKeys,
          inMintToSwap: solToSwap,
          slippage,
          txnMode,
        })
      const swapInstruction = await Liquidity.makeSwapInstructionSimple({
        connection: this.connection,
        poolKeys,
        userKeys: {
          tokenAccounts,
          owner: this.wallet.publicKey,
        },
        amountIn: amountInRaw,
        amountOut: amountOutRaw,
        fixedSide: 'in',
      })

      // Send the transaction
      const txn = new Transaction()
      swapInstruction.innerTransactions[0].instructions.forEach(
        (instruction) => {
          txn.add(instruction)
        }
      )
      const result = await this.connection.getLatestBlockhash()
      txn.recentBlockhash = result.blockhash
      txn.feePayer = this.wallet.publicKey
      txn.partialSign(this.wallet.payer)

      let txid = await this.connection.sendRawTransaction(txn.serialize())
      console.log('Transaction:', `https://solscan.io/tx/${txid}`)

      try {
        await this.connection.confirmTransaction(txid)
        console.log(`Success Raydium swap https://solscan.io/tx/${txid}`)
        return { status: 'SUCCESS', txn: `https://solscan.io/tx/${txid}` }
      } catch (error) {
        console.log(`Fail Raydium swap https://solscan.io/tx/${txid}`)
        return { status: 'FAIL', txn: `https://solscan.io/tx/${txid}` }
      }
    } catch (error) {
      console.log(error)
    }
  }
}

module.exports = { Raydium }
