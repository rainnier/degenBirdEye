const { default: axios } = require('axios')
const { getAllOg } = require('./ogList.js')

const solScanUrl = `https://api.solscan.io/v2/transaction`
const headersGems = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0', // Add this line
}

const fetchLatestGems30 = async (tx) =>
  axios
    .get(`${solScanUrl}?tx=${tx}&cluster=`, { headers: headersGems })
    .then((response) => {
      return response.data
    })
    .catch((error) => {
      // Handle errors
      console.error('Request failed:', error)
    })

async function testThis() {
  //   const response = await fetchLatestGems30(
  //     `63TnfAayDNLgBiKvM2u3HeAMZ1PwjwwbL43dgGS5FQhFKycctxvxKKSN8PfxPPBeTgEMyDEgFeqw6j36ctpPdbjM`
  //   )
  //   console.log(response.data.status)
  const allOg = await getAllOg()

  const txnObj = allOg
    .filter((x) => x.txn)
    .reduce((acc, obj) => {
      acc[obj.symbol] = obj.txn
      return acc
    }, {})

  for (data of Object.keys(txnObj)) {
    // const result = await fetchLatestGems30(txnObj[data])
    // console.log(result)
    console.log(
      `${txnObj[data]} = ${
        (
          await fetchLatestGems30(
            txnObj[data].replace('https://solscan.io/tx/', '')
          )
        ).data
      }`
    )
  }
}

testThis()
