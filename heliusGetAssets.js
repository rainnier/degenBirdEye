const url = `https://rpc.helius.xyz/?api-key=dbe86f49-5c64-4ece-a1b2-ba4709d5fc71`

const getAsset = async () => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'my-id',
      method: 'getAsset',
      params: {
        id: 'BeizCPsdiHy3FN8K14BjkZ9RWzcPftNe92jagGLiSPKH',
      },
    }),
  })

  const { result } = await response.json()
  console.log('asset: ', result)
}

getAsset()
