import {arrayToMap} from 'website-scrap-engine/lib/util';
import {Resource, ResourceType} from 'website-scrap-engine/lib/resource';
import {Cheerio} from 'website-scrap-engine/lib/types';

// manually collected
const validExtensionName = arrayToMap([
  'gif',
  'jpg', 'JPG', 'jpeg',
  'png', 'PNG',
  'svg',
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
  elem: Cheerio | null,
  parent: Resource | null
): ResourceType => {
  if (!((elem && (elem.is('a') || elem.is('iframe'))) ||
    (parent && parent.type === ResourceType.SiteMap))) {
    return type;
  }
  if (url.includes('/@api/deki/files/') && !url.endsWith('.html')) {
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

  const hashIndex: number = url.lastIndexOf('#');
  const searchIndex: number = hashIndex === -1 ?
    url.lastIndexOf('?') :
    url.lastIndexOf('?', hashIndex);
  const endIndex: number = searchIndex === -1 ?
    hashIndex :
    hashIndex === -1 ? searchIndex : Math.min(searchIndex, hashIndex);
  const endPath: number = endIndex === -1 ?
    url.lastIndexOf('/') :
    url.lastIndexOf('/', endIndex);
  const lastIndex: number = endIndex === -1 ?
    url.lastIndexOf('.') :
    url.lastIndexOf('.', endIndex);
  if (lastIndex !== -1 && lastIndex > endPath) {
    const extension: string = endIndex === -1 ?
      url.slice(lastIndex + 1).toLowerCase() :
      url.slice(lastIndex + 1, endIndex).toLowerCase();
    if (validExtensionName[extension]) {
      return ResourceType.Binary;
    } else if ('css' === extension) {
      return ResourceType.Css;
    } else {
      return ResourceType.Html;
    }
  }
  return type;
};
