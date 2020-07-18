/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const mkdir = require('mkdirp');

const readDir = dir => fs.promises.readdir(path.join(__dirname, dir), {
  withFileTypes: true
});

const copyIfNewer = async (src, dest) => {
  if (!fs.existsSync(dest)) {
    console.debug(new Date().toLocaleString(), 'copy', src, dest);
    return fs.promises.copyFile(src, dest);
  }
  let srcStat, destStat;
  srcStat = await fs.promises.stat(src);
  try {
    destStat = await fs.promises.stat(dest);
  } catch {
    console.debug(new Date().toLocaleString(), 'copy', src, dest);
    return fs.promises.copyFile(src, dest);
  }
  if (destStat && srcStat.mtimeMs <= destStat.mtimeMs) {
    return;
  }
  console.debug(new Date().toLocaleString(), 'copy', src, dest);
  return fs.promises.copyFile(src, dest);
};

(async () => {
  let dir = [''], queue = [], pending = [];
  queue.push(readDir('src'));
  let currentDir, currentContent, nextDir, srcFile, destFile;
  while (dir.length) {
    currentDir = dir.shift();
    currentContent = await queue.shift();
    for (let dirent of currentContent) {
      if (dirent.isDirectory()) {
        nextDir = path.join(currentDir, dirent.name);
        dir.push(nextDir);
        queue.push(readDir(path.join('src', nextDir)));
      } else if (dirent.isFile() && !dirent.name.endsWith('.ts')) {
        if (!fs.existsSync(nextDir = path.join(__dirname, 'lib', currentDir))) {
          console.debug(new Date().toLocaleString(), 'mkdir', nextDir);
          mkdir.sync(nextDir);
        }
        srcFile = path.join(__dirname, 'src', currentDir, dirent.name);
        destFile = path.join(nextDir, dirent.name);
        pending.push(copyIfNewer(srcFile, destFile));
      }
    }
  }
  return Promise.all(pending);
})();
