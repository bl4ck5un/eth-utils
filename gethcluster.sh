#!/bin/bash

cat <<EOF
bash cluster <root> <network_id> <number_of_nodes> <local_IP> [[params]...]
EOF

[[ $# -lt 5 ]] && {
    echo "Usage"
    exit 0;
}

GETH=geth

root=$1
shift
network_id=$1
dir=$root/$network_id
mkdir -p $dir/data
mkdir -p $dir/log
shift
N=$1
shift
ip_addr=$1
shift

if [ ! -f "$dir/nodes"  ]; then

  echo "[" >> $dir/nodes
  for ((i=0;i<N;++i)); do
    id=`printf "%02d" $i`
    if [ ! $ip_addr="" ]; then
      ip_addr="[::]"
    fi

    echo "getting enode for instance $id ($i/$N)"
    eth="$GETH --datadir $dir/data/$id --port 303$id --networkid $network_id"
    cmd="$eth js <(echo 'console.log(admin.nodeInfo.enode); exit();') "
    echo $cmd

    bash -c "$cmd" 2>/dev/null |\
        grep enode | \
        perl -pe "s/\[\:\:\]/$ip_addr/g" |\
        perl -pe "s/^/\"/; s/\s*$/\"/;" |\
        tee >> $dir/nodes

    if ((i<N-1)); then
      echo "," >> $dir/nodes
    fi

  done
  echo "]" >> $dir/nodes
fi

for ((i=0;i<N;++i)); do
  id=`printf "%02d" $i`
  mkdir -p $dir/data/$id
  echo "launching node $i/$N ---> tail-f $dir/log/$id.log"
  echo GETH=$GETH bash ./gethup.sh $dir $id --networkid $network_id $*
  GETH=$GETH bash ./gethup.sh $dir $id --networkid $network_id $*
done
