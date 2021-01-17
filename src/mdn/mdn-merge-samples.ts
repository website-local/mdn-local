import glob, {Entry} from 'fast-glob';
import cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import {mkdirRetry} from 'website-scrap-engine/lib/io';
import {sources} from 'website-scrap-engine/lib/sources';
import {ResourceType} from 'website-scrap-engine/lib/resource';
import type {Cheerio, CheerioStatic} from 'website-scrap-engine/lib/types';

export interface MdnSampleItem {
  cwd: string;
  size: number;
  path: string;
  key: string;
  isEmpty?: boolean;
  isCopy?: boolean;
  /**
   * void -> not parsed
   * empty array -> no resources
   */
  resources?: string[];
  /**
   * void: resource parsing not started or done
   * non-void: resource is pending for parse
   */
  pendingGetResources?: Promise<void>;
}

export interface MdnSamples {
  map: Record<MdnSampleItem['key'], MdnSampleItem>;
  sampleArray: MdnSampleItem[];
  cwd: string;
}

const MAX_EMPTY_FILE_SIZE = 600;

const mkdirCache: Record<string, ReturnType<typeof mkdirRetry>> = {};

const mkdir = (dir: string): ReturnType<typeof mkdirRetry> => {
  if (mkdirCache[dir]) return mkdirCache[dir];
  if (fs.existsSync(dir)) {
    return mkdirCache[dir] = Promise.resolve();
  }
  // console.debug('mkdir', dir);
  return mkdirCache[dir] = mkdirRetry(dir, 5);
};

const copyAndMkdir = async (src: string, dest: string) => {
  const dir: string = path.dirname(dest);
  try {
    await fs.promises.access(src, fs.constants.O_RDONLY);
  } catch (e) {
    // skip unreadable file
    if (e?.code != 'ENOENT') {
      console.error('copy', src, dest, e);
    }
    return;
  }
  await mkdir(dir);
  await fs.promises.copyFile(src, dest, fs.constants.COPYFILE_EXCL)
    .catch(err => {
      if (err?.code !== 'ENOENT' && err?.code !== 'EEXIST') {
        console.error('copy', src, dest, err);
      }
    });
  // console.debug('copy', src, dest);
};

const findSampleFiles = (basePath: string): Promise<Entry[]> => {
  return glob('*-*/**/*$samples/**.html', {
    caseSensitiveMatch: true,
    objectMode: true,
    stats: true,
    cwd: basePath
  });
};

const removeHash = (url: string): string => {
  if (!url || url[0] === '#') return '';
  const i = url.indexOf('#');
  if (i !== -1) {
    return url.slice(0, i);
  }
  return url;
};

const parseResourceSync = (item: MdnSampleItem, $: CheerioStatic): void => {
  const resources = [];
  for (const {attr, selector, type} of sources) {
    // TODO: parse srcset
    // TODO: parse inline css
    if (!attr || type === ResourceType.CssInline || attr === 'srcset') continue;
    const elements = $(selector);
    if (!elements.length) continue;
    for (let i = 0, l = elements.length, el; i < l; i++) {
      el = $(elements[i]);
      let res = el.attr(attr);
      if (res &&
        (res = removeHash(res)) &&
        !res.includes('/static/build/styles/samples.') &&
        !res.startsWith('/') &&
        !res.endsWith('/') &&
        !res.endsWith('.html') &&
        !res.startsWith('#') &&
        !res.includes(':')) {
        resources.push(res);
      }
    }
  }
  item.resources = resources;
  delete item.pendingGetResources;
};

const parseResourceAsync = async (item: MdnSampleItem): Promise<void> => {
  const file = path.join(item.cwd, item.path);
  const content: string = await fs.promises.readFile(file, {
    encoding: 'utf8'
  });
  if (!content) {
    item.isEmpty = true;
    item.resources = [];
    delete item.pendingGetResources;
    return;
  } else {
    parseResourceSync(item, cheerio.load(content));
  }
};

const parseResource = async (item: MdnSampleItem): Promise<void> => {
  if (item.resources !== undefined) {
    return;
  }
  if (!item.pendingGetResources) {
    item.pendingGetResources = parseResourceAsync(item);
  }
  await item.pendingGetResources;
};

const copyResources = async (item: MdnSampleItem, targetPath: string): Promise<void> => {
  if (item.resources === undefined || item.isEmpty || item.isCopy) {
    await parseResource(item);
  }
  if (!item.resources?.length) {
    return;
  }
  const itemDir: string = path.dirname(path.join(item.cwd, item.path));
  const targetDir: string = path.dirname(targetPath);
  const pending: Promise<void>[] = [];
  for (let i = 0, l = item.resources.length, res; i < l; i++) {
    res = item.resources[i];
    const resPath = path.resolve(itemDir, res);
    const targetResPath = path.resolve(targetDir, res);
    pending.push(copyAndMkdir(resPath, targetResPath));
  }
  if (pending.length) {
    await Promise.all(pending);
  }
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
    item.resources = [];
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
    item.resources = [];
  } else {
    parseResourceSync(item, $);
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
    samples[i] = {map, sampleArray, cwd: basePath[i]};
  }

  await Promise.all(checkIsEmptyPromiseArray);

  const copyFilePromiseArray: Promise<void>[] = [];
  for (let i = 0; i < samples.length; i++) {
    const currentSamples: MdnSamples = samples[i];
    if (!currentSamples || !currentSamples.sampleArray?.length) continue;
    const cwd: string = currentSamples.cwd;
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
          const targetPath = path.join(cwd, locale, compareItem.key);
          copyFilePromiseArray.push(copyAndMkdir(
            path.join(compareItem.cwd, compareItem.path), targetPath)
            .catch(console.log));
          copyFilePromiseArray.push(copyResources(compareItem, targetPath));
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
              isCopy: true,
              // assuming no resources for copied sample
              resources: []
            };
          }
        }
      }
    }
  }
  await Promise.all(copyFilePromiseArray);
};
