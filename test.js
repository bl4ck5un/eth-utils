userAddr = eth.accounts[0]
minerAddr = eth.accounts[1]

gasCnt = 3 * Math.pow(10,6)
personal.unlockAccount(userAddr, '123123')
personal.unlockAccount(minerAddr, '123123')
source = 'contract TownCrier { struct Request { uint8 requestType; address requester; uint fee; address callbackAddr; bytes4 callbackFID; bytes32[] requestData; } event RequestLog(uint gasLeft, int16 flag); event RequestInfo(uint64 id, uint8 requestType, address requester, uint fee, address callbackAddr, uint reqLen, bytes32[] requestData); event DeliverLog(uint gasLeft, int flag); event DeliverInfo(uint64 requestId, uint fee, uint gasPrice, uint gasLeft, uint callbackGas, uint requestLen, bytes32 response); event Cancel(uint64 requestId, address canceller, address requester, int flag); address constant SGX_ADDRESS = 0x9d10ea5ad51e1af69cd8d4dcfa60f577818607b2; uint constant GAS_PRICE = 5 * 10**10; uint constant MAX_FEE = (3 * 10**6) * GAS_PRICE; uint constant MIN_FEE_BASE = 30000 * GAS_PRICE; uint constant FEE_PER_32BYTES = 2600 * GAS_PRICE; uint constant CANCELLATION_FEE_BASE = 23000 * GAS_PRICE; uint constant CANCELLATION_FEE_PER_32BYTES = 2200 * GAS_PRICE; uint constant CANCELLED_FEE_FLAG = 1; uint constant DELIVERED_FEE_FLAG = 0; uint64 requestCnt = 0; Request[2**64] requests; function request(uint8 requestType, address callbackAddr, bytes4 callbackFID, bytes32[] requestData) public returns (uint64) { RequestLog(msg.gas, 0); uint minFee = MIN_FEE_BASE + (FEE_PER_32BYTES * requestData.length); if (msg.value < minFee || msg.value > MAX_FEE) { RequestInfo(0, requestType, msg.sender, msg.value, callbackAddr, requestData.length, requestData); RequestLog(msg.gas, -1); return 0; } else { requestCnt++; uint64 requestId = requestCnt; requests[requestId].requestType = requestType; requests[requestId].requester = msg.sender; requests[requestId].fee = msg.value; requests[requestId].callbackAddr = callbackAddr; requests[requestId].callbackFID = callbackFID; requests[requestId].requestData = requestData; RequestInfo(requestId, requestType, msg.sender, msg.value, callbackAddr, requestData.length, requests[requestId].requestData); RequestLog(msg.gas, 1); return requestId; } } function deliver(uint64 requestId, uint8 requestType, bytes32[] requestData, bytes32 respData) public { bytes32[] storage storedRequestData = requests[requestId].requestData; uint fee = requests[requestId].fee; if (msg.sender != SGX_ADDRESS || requests[requestId].requester == 0 || requests[requestId].requestType != requestType || fee == DELIVERED_FEE_FLAG) { DeliverInfo(requestId, fee, tx.gasprice, msg.gas, 0, requestData.length, respData); DeliverLog(msg.gas, -1); return; } else if (storedRequestData.length != requestData.length) { DeliverInfo(requestId, fee, tx.gasprice, msg.gas, 0, requestData.length, respData); DeliverLog(msg.gas, -4); return; } else if (requests[requestId].fee == CANCELLED_FEE_FLAG) { DeliverLog(msg.gas, 1); uint cancellationFee = CANCELLATION_FEE_BASE + (requestData.length * CANCELLATION_FEE_PER_32BYTES); SGX_ADDRESS.send(cancellationFee); requests[requestId].fee = DELIVERED_FEE_FLAG; DeliverLog(msg.gas, int(cancellationFee)); return; } DeliverLog(msg.gas, 4); for (uint16 i = 0; i < requestData.length; i++) { if (storedRequestData[i] != requestData[i]) { DeliverLog(msg.gas, int16(i)); return; } } DeliverLog(msg.gas, 8); SGX_ADDRESS.send(fee); requests[requestId].fee = DELIVERED_FEE_FLAG; DeliverLog(msg.gas, 16); uint callbackGas = (fee - (MIN_FEE_BASE + FEE_PER_32BYTES * requestData.length)) / tx.gasprice; DeliverInfo(requestId, fee, tx.gasprice, msg.gas, callbackGas, requestData.length, respData); bool deliverSuccess = requests[requestId].callbackAddr.call.gas(callbackGas)(requests[requestId].callbackFID, requestId, respData); if (deliverSuccess) { DeliverLog(msg.gas, 32); } else { DeliverLog(msg.gas, -2); } } function cancel(uint64 requestId) public returns (bool) { uint cancellationFee = CANCELLATION_FEE_BASE + (requests[requestId].requestData.length * CANCELLATION_FEE_PER_32BYTES); Cancel(requestId, msg.sender, requests[requestId].requester, int(fee)); uint fee = requests[requestId].fee; if (requests[requestId].requester == msg.sender && fee > cancellationFee) { msg.sender.send(fee - cancellationFee); requests[requestId].fee = CANCELLED_FEE_FLAG; Cancel(requestId, msg.sender, requests[requestId].requester, int(CANCELLED_FEE_FLAG)); return true; } else { Cancel(requestId, msg.sender, requests[requestId].requester, -int(CANCELLED_FEE_FLAG)); return false; } }}contract PutOption { event Put(bytes32 timestamp, uint gas, bytes32[] data); event Pay(uint unitPrice, int amount); uint constant TC_FEE = (30000 + (2600 * 2) + 18000) * 5 * 10**10; bytes4 constant TC_CALLBACK_FID = 0x3d622256; address ISSUER; TownCrier public TC_CONTRACT; bytes32 public TICKER; uint public UNIT_PRICE; uint public MAX_UNITS; uint public STRIKE_PRICE; uint public EXPR_DATE; address buyer; uint units; bool optionPut; bool cancelled; function PutOption(TownCrier tcContract, bytes32 ticker, uint unitPrice, uint maxUnits, uint strikePrice, uint exprDate) public { if (msg.value < (strikePrice - unitPrice) * maxUnits + TC_FEE) throw; ISSUER = msg.sender; TC_CONTRACT = tcContract; TICKER = ticker; UNIT_PRICE = unitPrice; MAX_UNITS = maxUnits; STRIKE_PRICE = strikePrice; EXPR_DATE = exprDate; optionPut = false; cancelled = false; } function buy(uint unitsToBuy) public { if (cancelled || block.timestamp >= EXPR_DATE || buyer != 0 || unitsToBuy > MAX_UNITS || unitsToBuy * UNIT_PRICE != msg.value) throw; buyer = msg.sender; units = unitsToBuy; uint issuerRefund = this.balance - (unitsToBuy * STRIKE_PRICE) - TC_FEE; if (issuerRefund > 0) { ISSUER.send(issuerRefund); } } function put() public { if (msg.sender != buyer || block.timestamp >= EXPR_DATE || optionPut) throw; optionPut = true; uint time = block.timestamp; bytes32[] memory tcData = new bytes32[](2); tcData[0] = TICKER; tcData[1] = bytes32(time); Put(bytes32(time), msg.gas, tcData); TC_CONTRACT.request.value(TC_FEE)(1, this, TC_CALLBACK_FID, tcData); } function pay(uint64 requestId, bytes32 priceBytes) public { if (msg.sender != address(TC_CONTRACT)) throw; uint price = uint(priceBytes); uint optionValue; if (price < STRIKE_PRICE) { optionValue = (STRIKE_PRICE - price) * units; buyer.send(optionValue); Pay(price, int(optionValue)); } else { Pay(price, 0); } ISSUER.send(this.balance); } function recover() public { if (msg.sender != ISSUER || (buyer != 0 && block.timestamp < EXPR_DATE) || optionPut || cancelled) throw; cancelled = true; ISSUER.send(this.balance); }}contract FlightInsurance { event Insure(address sender, uint dataLength, bytes32[] data, int72 requestId); event PaymentLog(int flag); event PaymentInfo(address payee, uint payeeBalance, uint gasRemaining, uint64 requestId, uint delay, uint amount); event FlightCancel(address canceller, address requester, bool success); uint constant TC_FEE = (30000 + (2600 * 32) + 4400) * 5 * 10**10; uint constant FEE = 5 * 10**18; uint constant PAYOUT = 10**20; uint32 constant PAYOUT_DELAY = 30; bytes4 constant TC_CALLBACK_FID = 0x3d622256; TownCrier TC_CONTRACT; address[2**64] requesters; function FlightInsurance(TownCrier tcCont) public { TC_CONTRACT = tcCont; } function insure(bytes32[] encryptedFlightInfo) public { if (msg.value != FEE) { Insure(msg.sender, encryptedFlightInfo.length, encryptedFlightInfo, -1); return; } Insure(msg.sender, encryptedFlightInfo.length, encryptedFlightInfo, -2); uint64 requestId = TC_CONTRACT.request.value(TC_FEE)(0, this, TC_CALLBACK_FID, encryptedFlightInfo); Insure(msg.sender, encryptedFlightInfo.length, encryptedFlightInfo, -3); requesters[requestId] = msg.sender; Insure(msg.sender, encryptedFlightInfo.length, encryptedFlightInfo, int72(requestId)); } function pay(uint64 requestId, bytes32 delay) public { address requester = requesters[requestId]; if (msg.sender != address(TC_CONTRACT)) { PaymentLog(-1); return; } else if (requesters[requestId] == 0) { PaymentLog(-2); return; } PaymentLog(1); PaymentInfo(requester, requester.balance, msg.gas, requestId, uint(delay), 1); if (uint(delay) >= PAYOUT_DELAY) { address(requester).send(PAYOUT); PaymentInfo(requester, requester.balance, msg.gas, requestId, uint(delay), PAYOUT); } else { PaymentInfo(requester, requester.balance, msg.gas, requestId, uint(delay), 0); } requesters[requestId] = 0; PaymentLog(2); } function cancel(uint64 requestId) public returns (bool) { if (requesters[requestId] == msg.sender) { bool tcCancel = TC_CONTRACT.cancel(requestId); if (tcCancel) { FlightCancel(msg.sender, requesters[requestId], true); requesters[requestId] = 0; msg.sender.send(FEE); return true; } } FlightCancel(msg.sender, requesters[requestId], false); return false; }}'

contracts = eth.compile.solidity(source)
TownCrier = eth.contract(contracts.TownCrier.info.abiDefinition)
FlightInsurance = eth.contract(contracts.FlightInsurance.info.abiDefinition)
PutOption = eth.contract(contracts.PutOption.info.abiDefinition);

// mine something first

/*
tc = TownCrier.new({ from: userAddr, data: contracts.TownCrier.code, gas: gasCnt }, function(e, c) { if (!e && c.address) { console.log(c.address) } else { console.log(e) } });

// mine
miner.start(1); admin.sleepBlocks(1); miner.stop(1);

tc.RequestLog(function(e,r) { console.log('RequestLog: ' + JSON.stringify(r.args))  })
tc.RequestInfo(function(e,r) { if (!e) { console.log('RequestInfo: ' + JSON.stringify(r.args))  } else { console.log(e)  }  })

fi = FlightInsurance.new(tc.address, {from: userAddr, data: contracts.FlightInsurance.code, gas: gasCnt, value: Math.pow(10,22)}, function(e, c) {if (!e && c.address) {console.log(c.address)} else {console.log(e)}});

// mine
miner.start(1); admin.sleepBlocks(1); miner.stop(1);

dataAry = Array(1); for (var i = 0; i < dataAry.length; i++) { dataAry[i] = Array(33).join('a');  };

fi.Insure(function(e,r) { if (!e) { console.log('Insure: ' + JSON.stringify(r.args))  } else { console.log(e)  }  });

fi.insure.sendTransaction(dataAry, {from: userAddr, gas: gasCnt, value: 5 * Math.pow(10,18)})

// mine
miner.start(1); admin.sleepBlocks(1); miner.stop(1);
*/
