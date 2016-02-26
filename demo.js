var tradeContract = createSteamTrade(encryptedApiKey, 'Portal', 1e+18);

//// These are just for testing!
//var paramsHash = undefined;
//var requestInfoF = function(e,r) { if (!e) { console.log('RequestInfo: ' + JSON.stringify(r.args)); paramsHash = r.args.paramsHash; } else { console.log(e) } };
//tc.RequestInfo(requestInfoF)

tradeContract.Buy(function(e,r) { console.log('Buy: ' + JSON.stringify(r.args)) });

purchase(tradeContract, buyerSteamId, 60);

// Transfer the item and wait for a minute

//// More testing!
//tc.DeliverLog(function(e,r) { console.log('DeliverLog: ' + JSON.stringify(r.args)) })
//tc.DeliverInfo(function(e,r) { console.log('DeliverInfo: ' + JSON.stringify(r.args)) })
//tc.deliver.sendTransaction(1, paramsHash, '0x0000000000000000000000000000000000000000000000000000000000000001', {from: sgxAddr, gas: gasCnt});

var sellerBalanceBefore = Number(debug.dumpBlock('latest').accounts[sellerAddr.substring(2)].balance);

miner.start(1); admin.sleepBlocks(1); miner.stop(1);

var sellerBalanceAfter = Number(debug.dumpBlock('latest').accounts[sellerAddr.substring(2)].balance);

sellerBalanceAfter - sellerBalanceBefore;
