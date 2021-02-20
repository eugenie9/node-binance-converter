const { createWebSocketStream } = require("ws")
const binanceEngine = require("./binance")
const express = require("express")
const bodyParser = require("body-parser")
const http_port = 3006

let initHttpServer = async() => {
  console.log("fetching binance exchange")
  await binanceEngine.initExchangeInfo()
  console.log("binance done")
  const app = express();

  app.set("view engine", "ejs");
  app.set("views", (__dirname + "/views"));
  app.use("/", express.static("public"));
  app.use(express.static(__dirname + "/public"));
  // app.use(bodyParser.urlencoded({ extended: true }));
  // app.use(bodyParser.json());
  // app.use(bodyParser.raw());
  app.use(express.json())
  app.use(express.urlencoded())

  app.get("/", async(req,res) => {
    res.render("index", {pairs: binanceEngine.pairs})
  })

  app.post("/findPath", async(req,res) => {
    let {base, converted} = req.body
    let match = binanceEngine.getConversionPath(base,converted)
    res.send(JSON.stringify(match))
  })

  app.listen(http_port, () =>
    console.log("Listening http on port: " + http_port)
  );
};

initHttpServer()
