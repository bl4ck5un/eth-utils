#!/bin/bash

datadir=$HOME/chain0/data/00
mkdir -p $datadir

read -p "Do you need a new account?" yn
case $yn in
	[Yy]*) geth --datadir $datadir account new;; 
	*    ) echo "no account created";;
esac

geth --datadir=$datadir removedb

coinbase=$(geth --datadir $datadir account list |\
	head -n1 |\
	perl -ne '/([a-f0-9]{40})/ && print $1')

localip=10.0.2.15

geth --datadir=$datadir \
  --identity="00" \
  --password <(echo zhan9f) \
  --unlock 0 \
  --networkid="93819023" \
  --etherbase="$coinbase" \
  --port=30000 \
  --rpc \
  --rpcaddr=$localip\
  --rpcport=8200\
  --rpccorsdomain='*' \
  --genesis=genesis.json \
  console 
