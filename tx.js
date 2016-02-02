var Tx = require('ethereumjs-tx')
var privateKey = new Buffer('cd244b3015703ddf545595da06ada5516628c5feadbf49dc66049c4b370cc5d8', 'hex')

var rawTx = {
  nonce: '0x00',
  gasPrice: '0x09184e72a000', 
  gasLimit: '0x2710',
  to: '0x0000000000000000000000000000000000000000', 
  value: '0x00', 
  data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057'
}

var tx = new Tx(rawTx)
tx.sign(privateKey)
var serializedTx = tx.serialize()
var pk = tx.getSenderPublicKey()
var addr = tx.getSenderAddress()

console.log(addr)

