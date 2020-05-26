const glob = require('fast-glob');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const mkdir = require('mkdirp');

const MAX_EMPTY_FILE_SIZE = 600;

const mkdirRetry = async (dir, retry = 5) => {
  for (let i = 0; i < retry; i++) {
    try {
      await mkdir(dir);
    } catch (ignored) {
      continue;
    }
    break;
  }
};

const copyAndMkdir = async (src, dest) => {
  let dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    await mkdirRetry(dir);
  }
  return await fs.promises.copyFile(src, dest);
};

const findSampleFiles = (basePath) => {
  return glob('*-*/**/*$samples/**.html', {
    caseSensitiveMatch: true,
    objectMode: true,
    stats: true,
    cwd: basePath
  });
};

const checkIsEmpty = async item => {
  if (item.size > MAX_EMPTY_FILE_SIZE) {
    return;
  }
  // noinspection JSCheckFunctionSignatures
  let content = await fs.promises.readFile(path.join(item.cwd, item.path), {
    encoding: 'utf8'
  });
  if (!content) {
    item.isEmpty = true;
    return ;
  }
  let $ = cheerio.load(content);
  let body = $('body'), html;
  if (!body.length ||
    !(html = body.html()) ||
    !(html = html.trim()) ||
    !html.length) {
    item.isEmpty = true;
  }
};

const mergeSamples = async (...basePath) => {
  if (!basePath || !basePath.length || !Array.isArray(basePath)) {
    return;
  }
  let result = await Promise.all(basePath.map(findSampleFiles));
  let samples = [], checkIsEmptyPromiseArray = [];
  for (let i = 0; i < result.length; i++) {
    let currentSamples = result[i];
    let map = {};
    let sampleArray = [];
    for (let j = 0; j < currentSamples.length; j++) {
      let item = {
        cwd: basePath[i],
        size: currentSamples[j].stats.size,
        path: currentSamples[j].path,
        key: currentSamples[j].path.replace(/\w+-\w+/i, '')
      };
      sampleArray.push(map[item.key] = item);
    }
    checkIsEmptyPromiseArray =
      checkIsEmptyPromiseArray.concat(sampleArray.map(checkIsEmpty));
    samples[i] = {map, sampleArray};
  }

  await Promise.all(checkIsEmptyPromiseArray);

  let copyFilePromiseArray = [];
  for (let i = 0; i < samples.length; i++) {
    let currentSamples = samples[i];
    if (!currentSamples) continue;
    let cwd = currentSamples.sampleArray[0].cwd;
    let locale = currentSamples.sampleArray[0].path.match(/\w+-\w+/i);
    if (!locale || !(locale = locale[0])) {
      continue;
    }
    for (let j = 0; j < samples.length; j++) {
      if (j === i) continue;
      let compareSamples = samples[j];
      if (!compareSamples) continue;
      for (let k = 0; k < compareSamples.sampleArray.length; k++) {
        let compareItem = compareSamples.sampleArray[k];
        let item = currentSamples.map[compareItem.key];
        if (compareItem && !compareItem.isEmpty && (!item || item.isEmpty)) {
          copyFilePromiseArray.push(copyAndMkdir(
            path.join(compareItem.cwd, compareItem.path),
            path.join(cwd, locale, compareItem.key))
            .catch(console.log));
          if (item) {
            item.isEmpty = false;
          } else {
            currentSamples.map[compareItem.key] = {
              cwd,
              path: path.join(locale, compareItem.key),
              key: compareItem.key
            };
          }
        }
      }
    }
  }
  await Promise.all(copyFilePromiseArray);
};

module.exports = mergeSamples;
