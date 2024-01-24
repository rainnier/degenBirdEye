const { VersionedTransaction, LAMPORTS_PER_SOL } = require('@solana/web3.js')
const { default: axios } = require('axios')
const {
  TransactionExpiredTimeoutError,
} = require('@solana/web3.js/lib/index.cjs')
const { WSOL } = require('@raydium-io/raydium-sdk')
const { WsolCreator } = require('./WsolCreator')

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

class Jupiter {
  constructor({ connection, wallet }) {
    this.connection = connection
    this.wallet = wallet
  }

  static getQuote = async ({
    fromMintDecimals,
    fromMintAddress,
    toMintAddress,
    amount,
    slippageBps,
  }) => {
    if (fromMintDecimals < 1 || fromMintDecimals > 20) {
      return new Error(
        `Please provide fromMintDecimals, either it is too small or too big`
      )
    }

    let amountInDecimals = (amount * 10 ** fromMintDecimals).toFixed()

    return await axios
      .get(
        `https://quote-api.jup.ag/v6/quote?inputMint=${fromMintAddress}&outputMint=${toMintAddress}&amount=${amountInDecimals}&slippageBps=${slippageBps}`
      )
      .then((response) => {
        return response.data
      })
      .catch((error) => {
        return error
      })
  }

  processTransaction = async ({ quoteResponse }) => {
    const wsolCreator = new WsolCreator({
      connection: this.connection,
      wallet: this.wallet,
    })
    console.log(`buying in Jupiter`)
    const wsolResult = await wsolCreator.getOrCreateWsolAccount(0.03) // Add 0.03 WSOL

    if (!wsolResult) {
      return {
        status: 'FAIL',
        description: `Not enough sol for wsol`,
      }
    }

    const { swapTransaction } = await axios
      .post(
        'https://quote-api.jup.ag/v6/swap',
        {
          quoteResponse,
          userPublicKey: this.wallet.publicKey.toString(),
          wrapAndUnwrapSol: false,
          // feeAccount is optional. Use if you want to charge a fee. feeBps must have been passed in /quote API.
          // feeAccount: "fee_account_public_key"
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then((response) => {
        return response.data
      })

    // deserialize the transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64')
    var transaction = VersionedTransaction.deserialize(swapTransactionBuf)

    // sign the transaction
    transaction.sign([this.wallet.payer])

    // Execute the transaction
    const rawTransaction = transaction.serialize()

    let txid
    try {
      txid = await this.connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2,
      })
    } catch (error) {
      console.log(error)
      if (error instanceof TransactionExpiredTimeoutError) {
        console.log('Transaction expired. Retrying...')
        // Retry the transaction
        try {
          txid = await this.connection.sendRawTransaction(rawTransaction, {
            skipPreflight: true,
            maxRetries: 2,
          })
        } catch (error) {
          console.error('Error sending retry transaction:', error)
        }
      } else {
        console.error('Error sending transaction:', error)
      }
    }

    try {
      await this.connection.confirmTransaction(txid)
      console.log(`Success Jupiter swap https://solscan.io/tx/${txid}`)
      return {
        status: 'SUCCESS',
        txn: `https://solscan.io/tx/${txid}`,
      }
    } catch (error) {
      console.log(error)
      console.log(`Fail Jupiter swap https://solscan.io/tx/${txid}`)
      return {
        status: 'FAIL',
        txn: `https://solscan.io/tx/${txid}`,
      }
    }
  }

  buyInJupiter = async ({ toMintAddress, amt }) => {
    let result

    try {
      const quoteResponse = await Jupiter.getQuote({
        fromMintDecimals: WSOL.decimals,
        fromMintAddress: WSOL.mint,
        toMintAddress,
        amount: amt,
        slippageBps: 1000,
      })

      if (quoteResponse.error) {
        result = {
          status: 'FAIL',
          txn: `error txn`,
          error: quoteResponse.error,
        }
      } else {
        result = await this.processTransaction({
          quoteResponse,
        })
      }
    } catch (error) {
      result = {
        status: 'FAIL',
        txn: `error txn`,
        error,
      }
      return result
    }

    console.log('result', result)

    return result
  }
}

module.exports = { Jupiter }
