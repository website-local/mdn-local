import { arrayToMap } from 'website-scrap-engine/lib/util';
import {ResourceType} from 'website-scrap-engine/lib/resource';

// manually collected
const validExtensionName = arrayToMap([
  'gif',
  'jpg', 'JPG', 'jpeg',
  'png', 'PNG',
  'svg',
  'css',
  'js', 'jsm',
  'json',
  'txt',
  'jar',
  'woff2',
  'xul',
  'zip',
  'mp3', 'ogg',
  'mp4', 'flv', 'm4v', 'mkv', 'webm',
  'msi',
  'xpi',
  'rdf',
  'pdf',
  'dia',
  'eot',
  'psd'
]);

export const detectLinkType = (
  url: string,
  type: ResourceType,
  elem: Cheerio | null
): ResourceType => {
  if (!elem) {
    return type;
  }
  if (elem.is('a') || elem.is('iframe')) {
    const paths = url.split('/');
    if (url.includes('/@api/deki/files/')) {
      return ResourceType.Binary;
    }
    if (url.includes('/docs/') ||
      url.includes('Add-ons/WebExtensions') ||
      url.includes('Add-ons/Firefox_for_Android') ||
      url.includes('Apps/Build') ||
      url.includes('JavaScript_code_modules/') ||
      url.includes('Creating_XPCOM_Components/Building_the_WebLock_UI')) {
      return ResourceType.Html;
    }
    let arr;
    if (paths && paths.length &&
      (arr = paths[paths.length - 1].split('.')) && arr.length > 1) {
      if (!validExtensionName[arr[arr.length - 1].toLowerCase()]) {
        return ResourceType.Html;
      }
    }
  }
  return type;
};
