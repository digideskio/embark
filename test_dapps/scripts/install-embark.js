/* global __dirname process require */

const {execSync} = require('child_process');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

const execSyncInherit = (cmd) => execSync(cmd, {stdio: 'inherit'});

try {
  const {version} = require('../../lerna.json');
  const tarballs = glob.sync(
    path.join(__dirname, `../../packages/*/*-${version}.tgz`)
  );
  if (!tarballs.length) throw new Error();
  const workDir = path.join(__dirname, '../.embark/packaged');
  fs.mkdirpSync(workDir);
  const setup = [
    `cd ${workDir}`,
    `npm init -y`
  ].join(' && ');
  execSync(setup);
  const install = [
    `cd ${workDir}`,
    `npm install --no-package-lock ${tarballs.join(' ')}`
  ].join(' && ');
  console.log(`${install}\n`);
  execSyncInherit(install);
} catch (e) {
  process.exit(1);
}
