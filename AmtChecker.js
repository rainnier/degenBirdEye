const {
  Liquidity,
  Token,
  TokenAmount,
  TOKEN_PROGRAM_ID,
} = require('@raydium-io/raydium-sdk')

class AmtChecker {
  static async computeMinimumAmountWithSlippage({
    connection,
    poolKeys,
    inMintToSwap,
    slippage,
    txnMode = 'BUY',
  }) {
    const poolInfo = await Liquidity.fetchInfo({
      connection,
      poolKeys,
    })

    // Default BUY
    let inMint = poolKeys.quoteMint
    let inDecimals = poolKeys.quoteDecimals
    let outMint = poolKeys.baseMint
    let outDecimals = poolKeys.baseDecimals

    if (txnMode === 'SELL') {
      inMint = poolKeys.baseMint
      inDecimals = poolKeys.baseDecimals
      outMint = poolKeys.quoteMint
      outDecimals = poolKeys.quoteDecimals
    }

    let tokenIn = new Token(TOKEN_PROGRAM_ID, inMint, inDecimals)
    let tokenOut = new Token(TOKEN_PROGRAM_ID, outMint, outDecimals)

    const amountInRaw = new TokenAmount(
      tokenIn,
      (inMintToSwap * 10 ** tokenIn.decimals).toFixed()
    )

    const {
      amountOut,
      minAmountOut,
      currentPrice,
      executionPrice,
      priceImpact,
      fee,
    } = Liquidity.computeAmountOut({
      poolKeys,
      poolInfo,
      amountIn: amountInRaw,
      currencyOut: tokenOut,
      slippage,
    })

    const amountOutRaw = minAmountOut

    return { amountInRaw, amountOutRaw }
  }
}

module.exports = { AmtChecker }
