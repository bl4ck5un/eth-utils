var Tx = require('ethereumjs-tx')
var privateKey = new Buffer('cd244b3015703ddf545595da06ada5516628c5feadbf49dc66049c4b370cc5d8', 'hex')

var rawTx = {
  nonce: 10,
  gasPrice: 50000000000, 
  gasLimit: 90000,
  to: "0xb7e13de69228c37cdff506ea474f31343af33c05",
  value: 2000000,  
  data: ""
}

var tx = new Tx(rawTx)
tx.sign(privateKey)
var serializedTx = tx.serialize()
var pk = tx.getSenderPublicKey()
var addr = tx.getSenderAddress()

console.log("Addr: " + addr.toString('hex'))
console.log("TX: " + serializedTx.toString('hex'))
console.log("Hash: " + tx.hash().toString("hex"))
console.log("Velidate: ", tx.verifySignature())

