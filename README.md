How to use

## update local mainnet.json
node .\updateRaydiumPools.js

## update local jupiter coins
node .\updateJupiterCoins.js

## run local mainnet server after the mainnet.json is dowloaded using the updateRaydiumPools.js change to correct directory path
npx json-server C:\dev\raydium\mainnet.json --w

##run local og collection list replacing id for token and setting port to 3022 since 3000 is already used by mainnet.json
##change to correct directory path
npx json-server C:\dev\raydium\ogCollectionDegen.json --id token --port 3022 --w

##Start watching birdeye, buying, and notifying on tg
node ./Main.js

##Start checking to resell opportunity
node .\tokenResellerDegenCron.js
