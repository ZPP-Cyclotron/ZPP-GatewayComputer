# usage: setup.sh "path-to-deb-file" "destination (default: ~/Desktop) "path_to_json_config (optional)"


# get first argument:
first_arg=$1

# if $1 is empty or equal to help, print help and exit
if [ -z $first_arg ] || [ $first_arg == "help" ]; then
    echo "usage: setup.sh \"path-to-deb-file\" \"destination (default: ~/Desktop)\" \"path_to_json_config (optional)\""
    exit 1
fi

DEB_FILE=$first_arg

# get second argument:
second_arg=$2

# check if second argument is empty, if so, set it to ~/Desktop
if [ -z $second_arg ]; then
    DESTINATION=~/Desktop
else
    DESTINATION=$second_arg
fi

dpkg-deb -x $DEB_FILE $DESTINATION

# copy the folder $DESTINATION/usr/lib/gateway-computer-app to $DESTINATION
cp -r $DESTINATION/usr/lib/gateway-computer-app $DESTINATION

# remove the folder $DESTINATION/usr
rm -r $DESTINATION/usr

# get third argument:
third_arg=$3

# check if third argument is empty
if [ -z $third_arg ]; then
    echo "No json config file provided"
    echo "Setup complete"
else
    # copy the json config file to $DESTINATION
    cp $third_arg $DESTINATION  
fi