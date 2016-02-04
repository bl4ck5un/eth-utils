var Tx = require('ethereumjs-tx')
var privateKey = new Buffer('cd244b3015703ddf545595da06ada5516628c5feadbf49dc66049c4b370cc5d8', 'hex')

var rawTx = {
  nonce: 3,
  gasPrice: 50000000000,
  gasLimit: 90000,
  to: "0x762f3a1b5502276bd14ecc1cab7e5e8b5cb27197",
  value: 0,  
  data: "0x60fe47b1000000000000000000000000000000000000000000000000000000000000001b" 
}

var tx = new Tx(rawTx)
tx.sign(privateKey)
var serializedTx = tx.serialize()
var pk = tx.getSenderPublicKey()
var addr = tx.getSenderAddress()

console.log("Addr: " + addr.toString('hex'))
console.log("TX: " + serializedTx.toString('hex'))
console.log("Velidate: ", tx.verifySignature())

