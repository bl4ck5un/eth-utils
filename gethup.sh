#!/bin/bash
# Usage:
# bash /path/to/eth-utils/gethup.sh <datadir> <instance_name>

root=$1  # base directory to use for datadir and logs
shift
dd=$1  # double digit instance id like 00 01 02
shift


# logs are output to a date-tagged file for each run , while a link is
# created to the latest, so that monitoring be easier with the same filename
# TODO: use this if GETH not set
GETH=geth

# geth CLI params       e.g., (dd=04, run=09)
datetag=`date "+%c%y%m%d-%H%M%S"|cut -d ' ' -f 5`
datadir=$root/data/$dd        # /tmp/eth/04
log=$root/log/$dd.$datetag.log     # /tmp/eth/04.09.log
linklog=$root/log/$dd.current.log     # /tmp/eth/04.09.log
stablelog=$root/log/$dd.log     # /tmp/eth/04.09.log
password=$dd            # 04
port=311$dd              # 30304
rpcport=82$dd            # 8104

mkdir -p $root/data
mkdir -p $root/log
ln -sf "$log" "$linklog"

if [ ! -d "$root/keystore/$dd" ]; then
  echo create an account with password $dd [DO NOT EVER USE THIS ON LIVE]
  mkdir -p $root/keystore/$dd
  $GETH --datadir $datadir --password <(echo -n $dd) account new

  # backup keys
  cp -R "$datadir/keystore" $root/keystore/$dd
else
    echo "copying keys $root/keystore/$dd $datadir/keystore"
    cp -R $root/keystore/$dd/keystore/ $datadir/keystore/
fi


COINBASE=`$GETH --datadir=$datadir account list|head -n1|perl -ne '/([a-f0-9]{40})/ && print $1'`

echo $COINBASE

# bring up node `dd` (double digit)
# - using <rootdir>/<dd>
# - listening on port 303dd, (like 30300, 30301, ...)
# - launching json-rpc server on port 81dd (like 8100, 8101, 8102, ...)

$GETH --datadir=$datadir \
  --identity="$dd" \
  --etherbase="$COINBASE" \
  --port=$port \
  --password=<(echo -n $dd) \
  --rpc \
  --rpcaddr=172.31.59.11 \
  --rpcport=$rpcport \
  --rpccorsdomain='*' $* \
  2>&1 | tee "$stablelog" > "$log" &  

# to bring up logs, uncomment
# tail -f $log
