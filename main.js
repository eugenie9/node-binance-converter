const binanceEngine = require("./binance")

let start = async() => {
  await binanceEngine.initExchangeInfo()
  console.log(binanceEngine.getTradingPairs("BNB"))
}

start()