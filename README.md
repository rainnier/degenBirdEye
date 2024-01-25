How to use

## start installing packages

`npm install`

## Update local mainnet.json

`node .\updateRaydiumPools.js`

## Update local jupiter coins

`node .\updateJupiterCoins.js`

## Run local mainnet server after the mainnet.json is downloaded using the updateRaydiumPools.js change to correct directory path

`npx json-server C:\dev\raydium\mainnet.json --w`

## Run local og collection list replacing id for token and setting port to 3022 since 3000 is already used by mainnet.json and change to correct directory path

`npx json-server C:\dev\raydium\ogCollectionDegen.json --id token --port 3022 --w`

## Start watching birdeye, watching tg group, buying, and notifying on tg

`node ./Main.js`

## Start checking resell opportunity

`node .\tokenResellerDegenCron.js`

## You can also run in vscode from updating raydium poo to Main.js using Run Tasks

`ctrl+shift+P -> Run Tasks -> Run All Tasks`
