#!/bin/bash

datadir=$HOME/chain0/data/00
mkdir -p $datadir

geth --datadir=$datadir removedb

coinbase=$(geth --datadir $datadir account list |\
	head -n1 |\
	perl -ne '/([a-f0-9]{40})/ && print $1')

geth --datadir=$datadir \
  --identity="00" \
  --password <(echo zhan9f) \
  --unlock 0 \
  --networkid="93819023" \
  --etherbase="$coinbase" \
  --port=30000 \
  --rpc \
  --rpcaddr=127.0.0.1 \
  --rpcport=8200\
  --rpccorsdomain='*' $* \
  --genesis=genesis.json \
  --mine & 
