#!/bin/bash

timestamp=`date +%s%N | cut -b1-13`
which zip > /dev/null

if [ $? -ne 0 ]
then
  echo "zip not found, install it before running this command"
  exit 1
fi

mkdir -p build

version=`git describe --tags --abbrev=0`

echo "Packaging version $version"
filename=build/$version.zip

zip -r $filename assets devtools.html devtools.js generated \
                 manifest.json panel.html panel.js style.css

if [ $? -ne 0 ]
then
  echo "an error has occurred when trying to zip files"
  exit 2
fi

finished=`date +%s%N | cut -b1-13`
let elapsed=$finished-$timestamp
echo "produced $filename in $elapsed ms"
