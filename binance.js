const { config } = require("./config")
const binanceClient = require("node-binance-api")

const account = new binanceClient().options({
  APIKEY: config.APIKEY,
  APISECRET: config.APISECRET,
  reconnect: true,
  useServerTime: true
})

let markets = []
let pairsInfo = []

/**
 * Connects to the Binance API and fetches exchange info and trading pairs.
 */
let initExchangeInfo = async () => {
  try {
    let data = await account.exchangeInfo()
    if (data.symbols) {
      for (let obj of data.symbols) {
        if(obj.status!="TRADING") {
          continue
        }
        let filters = { status: obj.status }
        for (let filter of obj.filters) {
          if (filter.filterType == "MIN_NOTIONAL") {
            filters.minNotional = filter.minNotional
          } else if (filter.filterType == "PRICE_FILTER") {
            filters.minPrice = filter.minPrice
            filters.maxPrice = filter.maxPrice
            filters.tickSize = filter.tickSize
          } else if (filter.filterType == "LOT_SIZE") {
            filters.stepSize = filter.stepSize
            filters.minQty = filter.minQty
            filters.maxQty = filter.maxQty
          }
        }
        filters.orderTypes = obj.orderTypes
        pairsInfo[obj.symbol] = {}
        pairsInfo[obj.symbol].status = obj.status
        pairsInfo[obj.symbol].tokenName = obj.baseAsset
        pairsInfo[obj.symbol].marketName = obj.quoteAsset
        pairsInfo[obj.symbol].filters = filters
        pairsInfo[obj.symbol].trades = []
        pairsInfo[obj.symbol].ticks = []
        pairsInfo[obj.symbol].bollinger = []
      }
    }

    for (let pair in pairsInfo) {
      markets.push(pair)
    }
    return
  } catch (e) {
    console.log(e)
    return e
  }
}

let getTradingPairs = (askedPair) => {
  let array = []
  for(let pair in pairsInfo) {
    if(pairsInfo[pair].tokenName == askedPair) {
      array.push({tokenName: pairsInfo[pair].tokenName, marketName: pairsInfo[pair].marketName})
    }
  }
  return array
}

const binanceEngine = {
  markets,
  pairsInfo,
  initExchangeInfo,
  getTradingPairs
}

module.exports = binanceEngine
