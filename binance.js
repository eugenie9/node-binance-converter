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
let pairs = []

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
        if(!pairs.includes(obj.baseAsset)) {
          pairs.push(obj.baseAsset)
        } else if(!pairs.includes(obj.quoteAsset)) {
          pairs.push(obj.quoteAsset)
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

let ifMarketExists = (base, converted) => {
  for(let pair in pairsInfo) {
    if(pairsInfo[pair].tokenName == base && pairsInfo[pair].marketName == converted) {
      return true
    } else if(pairsInfo[pair].tokenName == converted && pairsInfo[pair].marketName ==base) {
      return true
    }
  }
  return false
}

let getTradingPairs = (askedPair) => {
  let array = []
  for(let pair in pairsInfo) {
    if(pairsInfo[pair].tokenName == askedPair || pairsInfo[pair].marketName == askedPair) {
      array.push({tokenName: pairsInfo[pair].tokenName, marketName: pairsInfo[pair].marketName})
    }
  }
  return array
}

let matchTradingPairs = (base, converted) => {
  let arr = []
  for(let b of base) {
    for(let c of converted) {
      if(b.marketName == c.marketName || b.marketName == c.tokenName) {
        arr.push([b, c])
      } 
    }
  }

  return arr
}

/**
 * Only supports up to 3 step conversion
 * @param {string} ba base asset
 * @param {string} co converted asset
 */
let getConversionPath = (ba,co) => {
  // If pairs cannot convert directly
  if(!binanceEngine.ifMarketExists(ba,co)) {
    let base = binanceEngine.getTradingPairs(ba)
    let converted = binanceEngine.getTradingPairs(co)
    let match = binanceEngine.matchTradingPairs(base,converted)
    let integratedMatch = match
    
    // If pairs cannot convert within two step
    if(match.length==0) {
      integratedMatch = []
      for(let b of base) {
        if(binanceEngine.ifMarketExists(b.marketName, co)) {
          integratedMatch.push([{tokenName: ba, marketName:b.marketName}, {tokenName: b.marketName, marketName: co}])
          continue
        }

        let newBase = binanceEngine.getTradingPairs(b.marketName)
        let newMatch = binanceEngine.matchTradingPairs(newBase, converted)
        if(newMatch.length) {
          for(let i=0; i<newMatch.length; i++) {
            newMatch[i].unshift({tokenName: ba, marketName: b.marketName})
          }
          integratedMatch.push(newMatch[0])
        }
      }
    } 
    return integratedMatch
  }
  return [[{tokenName: ba, marketName: co}]]
} 

const binanceEngine = {
  markets,
  pairsInfo,
  pairs,
  initExchangeInfo,
  ifMarketExists,
  getTradingPairs,
  matchTradingPairs,
  getConversionPath
}

module.exports = binanceEngine
