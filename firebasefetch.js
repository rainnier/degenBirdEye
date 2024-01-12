const admin = require('firebase-admin')
const serviceAccount = require('C:\\dev\\raydium\\solana-degen-project-firebase-adminsdk-6cbmo-b62ce7c253.json') // Replace with your actual service account key path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://solana-degen-project.firebaseio.com', // Replace with your actual database URL
})

const firestore = admin.firestore()
const firebaseCollection = 'ogCollection'
async function fetchData() {
  try {
    const snapshot = await firestore.collection(firebaseCollection).get() // Replace with your actual collection name
    const data = []

    snapshot.forEach((doc) => {
      data.push(doc.data())
    })

    return data
  } catch (error) {
    console.error('Error fetching data from Firestore:', error.message || error)
    throw error
  }
}

const fs = require('fs')

function saveToLocalFile(data) {
  const filePath = 'C:\\dev\\raydium\\ogCollection.json'

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))

  console.log(`Data saved to ${filePath}`)
}

fetchData()
  .then((data) => {
    saveToLocalFile({ ogCollection: data })
  })
  .catch((error) => {
    console.error('Error:', error.message || error)
  })
