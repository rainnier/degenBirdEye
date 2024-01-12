const fs = require('fs')
const axios = require('axios')
const { CronJob } = require('cron')

// Function to fetch data from the server
const serverUrl = `https://token.jup.ag/all`
async function fetchData() {
  try {
    // Replace 'YOUR_SERVER_ENDPOINT' with the actual server endpoint
    const response = await axios.get(serverUrl)

    // remove name property
    const objData = { allCoins: response.data }
    // Save the data to a file
    const filePath = 'C:\\dev\\jupiter\\all.json' // Replace with correct path of all.json
    // Used in Jupiter to determine coin and decimals
    fs.writeFileSync(filePath, JSON.stringify(objData, null, 2))

    console.log(`Data successfully saved to ${filePath}`)
  } catch (error) {
    console.error('Error fetching data:', error.message || error)
  }
}
// Initially fetch
fetchData()

// Call the function to fetch and save data - every 5 minutes
var job = new CronJob('0 */5 * * * *', fetchData, null, true, 'Asia/Manila')
