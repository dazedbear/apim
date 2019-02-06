const path = require('path');
const chalk = require('chalk');
const fs = require('fs-extra');
const AdmZip = require('adm-zip')
const { spawnSync } = require("child_process")

const zip = new AdmZip();
const paths = {
  modulePath: path.join(process.cwd(), 'node_modules'),
  lambdaPath: path.join(process.cwd(), 'index.js'),
  zipPath: path.join(process.cwd(), 'build.zip'),
}

// 安裝套件
spawnSync('yarn',  [], { shell: true });
console.log(chalk.white('Install production\'s modules success.'));

// 清除先前的打包資料
if (fs.existsSync(paths.zipPath)) {
  fs.removeSync(paths.zipPath)
  console.log(chalk.white('Clear previous bundle success.'));
}

// 打包檔案
zip.addLocalFile(paths.lambdaPath);
zip.addLocalFolder(paths.modulePath, 'node_modules');
zip.writeZip(paths.zipPath);

console.log(chalk.green('Bundle AWS Lambda Layer success.\n'))