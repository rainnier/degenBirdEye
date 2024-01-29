class TxnChecker {
  constructor({ connection }) {
    this.connection = connection
  }
  async isTxnSuccessful({ signature }) {
    const data = await this.connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    })
    return !!data?.meta?.status?.hasOwnProperty('Ok')
  }
  async isSolscanTxnSuccessful({ url }) {
    const prefix = 'https://solscan.io/tx/'
    const signature = url.substring(prefix.length)
    const data = await this.connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    })
    return !!data?.meta?.status?.hasOwnProperty('Ok')
  }
}

module.exports = { TxnChecker }
