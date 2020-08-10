import glob, {Entry} from 'fast-glob';
import cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import {mkdirRetry} from 'website-scrap-engine/lib/io';

export interface MdnSampleItem {
  cwd: string;
  size: number;
  path: string;
  key: string;
  isEmpty?: boolean;
  isCopy?: boolean;
}

export interface MdnSamples {
  map: Record<MdnSampleItem['key'], MdnSampleItem>;
  sampleArray: MdnSampleItem[];
}

const MAX_EMPTY_FILE_SIZE = 600;

const copyAndMkdir = async (src: string, dest: string) => {
  const dir: string = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    await mkdirRetry(dir);
  }
  await fs.promises.copyFile(src, dest);
};

const findSampleFiles = (basePath: string): Promise<Entry[]> => {
  return glob('*-*/**/*$samples/**.html', {
    caseSensitiveMatch: true,
    objectMode: true,
    stats: true,
    cwd: basePath
  });
};

const checkIsEmpty = async (item: MdnSampleItem): Promise<void> => {
  if (item.size > MAX_EMPTY_FILE_SIZE) {
    return;
  }
  const file = path.join(item.cwd, item.path);
  const content: string = await fs.promises.readFile(file, {
    encoding: 'utf8'
  });
  if (!content) {
    item.isEmpty = true;
    return;
  }
  const $: CheerioStatic = cheerio.load(content);
  const body: Cheerio = $('body');
  let html;
  if (!body.length ||
    !(html = body.html()) ||
    !(html = html.trim()) ||
    !html.length) {
    item.isEmpty = true;
  }
};

export const mergeSamples = async (...basePath: string[]): Promise<void> => {
  if (!basePath || !basePath.length || !Array.isArray(basePath)) {
    return;
  }
  const result: Entry[][] = await Promise.all(basePath.map(findSampleFiles));
  const samples: MdnSamples[] = [];
  let checkIsEmptyPromiseArray: Promise<void>[] = [];
  for (let i = 0; i < result.length; i++) {
    const currentSamples: Entry[] = result[i];
    const map: Record<MdnSampleItem['key'], MdnSampleItem> = {};
    const sampleArray: MdnSampleItem[] = [];
    for (let j = 0; j < currentSamples.length; j++) {
      const item: MdnSampleItem = {
        cwd: basePath[i],
        size: currentSamples[j].stats?.size ?? 0,
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

  const copyFilePromiseArray: Promise<void>[] = [];
  for (let i = 0; i < samples.length; i++) {
    const currentSamples: MdnSamples = samples[i];
    if (!currentSamples) continue;
    const cwd: string = currentSamples.sampleArray[0].cwd;
    const localeMatch = currentSamples.sampleArray[0].path.match(/\w+-\w+/i);
    let locale: string;
    if (!localeMatch || !(locale = localeMatch[0])) {
      continue;
    }
    for (let j = 0; j < samples.length; j++) {
      if (j === i) continue;
      const compareSamples: MdnSamples = samples[j];
      if (!compareSamples) continue;
      for (let k = 0; k < compareSamples.sampleArray.length; k++) {
        const compareItem: MdnSampleItem = compareSamples.sampleArray[k];
        const item: MdnSampleItem = currentSamples.map[compareItem.key];
        if (compareItem &&
          !compareItem.isEmpty && !compareItem.isCopy &&
          (!item || item.isEmpty)) {
          copyFilePromiseArray.push(copyAndMkdir(
            path.join(compareItem.cwd, compareItem.path),
            path.join(cwd, locale, compareItem.key))
            .catch(console.log));
          if (item) {
            item.isEmpty = false;
            item.isCopy = true;
          } else {
            currentSamples.map[compareItem.key] = {
              cwd,
              path: path.join(locale, compareItem.key),
              key: compareItem.key,
              size: compareItem.size,
              isEmpty: compareItem.isEmpty,
              isCopy: true
            };
          }
        }
      }
    }
  }
  await Promise.all(copyFilePromiseArray);
};
