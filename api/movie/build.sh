#!/bin/bash

MODULE_NAME="node_modules"
BUILD_NAME="nodejs"

# 清除 node_modules
if [ -d "./$MODULE_NAME" ]; then
  rm -rf "./$MODULE_NAME"
  echo "$(date +%Y-%m-%d" "%H:%M:%S) [build] clear previous modules";
fi

# 清除先前的打包資料
if [ -f "./$BUILD_NAME.zip" ]; then
  rm -f "./$BUILD_NAME.zip"
  echo "$(date +%Y-%m-%d" "%H:%M:%S) [build] clear previous build";
fi

# 安裝套件 (production only)
yarn --production
echo "$(date +%Y-%m-%d" "%H:%M:%S) [build] install production's modules success.";

# 打包檔案
echo "$(date +%Y-%m-%d" "%H:%M:%S) [build] start bundle aws lambda layer";
mkdir ./$BUILD_NAME
cp -r ./$MODULE_NAME ./$BUILD_NAME/$MODULE_NAME
zip -r $BUILD_NAME.zip ./$BUILD_NAME
rm -rf $BUILD_NAME
echo "$(date +%Y-%m-%d" "%H:%M:%S) [build] bundle aws lambda layer success.";