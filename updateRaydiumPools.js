const fs = require('fs')
const axios = require('axios')
const { CronJob } = require('cron')

// Function to fetch data from the server
const serverUrl = `https://api.raydium.io/v2/sdk/liquidity/mainnet.json`
async function fetchData() {
  try {
    // Replace 'YOUR_SERVER_ENDPOINT' with the actual server endpoint
    const response = await axios.get(serverUrl)

    // remove name property
    delete response.data.name
    // Save the data to a file
    const filePath = 'C:\\dev\\raydium\\mainnet.json' // Change correct path
    fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2))

    console.log(`Data successfully saved to ${filePath}`)
  } catch (error) {
    console.error('Error fetching data:', error.message || error)
  }
}

// Call the function to fetch and save data - every 2 minutes
var job = new CronJob('0 */5 * * * *', fetchData, null, true, 'Asia/Manila')
