#!/bin/bash

# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

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
