import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdirp as mkdir} from 'mkdirp';

const readDir = dir => fs.promises.readdir(path.join(dirname, dir), {
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

const dirname = path.dirname(fileURLToPath(import.meta.url));
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
      if (!fs.existsSync(nextDir = path.join(dirname, 'lib', currentDir))) {
        console.debug(new Date().toLocaleString(), 'mkdir', nextDir);
        mkdir.mkdirpSync(nextDir);
      }
      srcFile = path.join(dirname, 'src', currentDir, dirent.name);
      destFile = path.join(nextDir, dirent.name);
      pending.push(copyIfNewer(srcFile, destFile));
    }
  }
}
await Promise.all(pending);
