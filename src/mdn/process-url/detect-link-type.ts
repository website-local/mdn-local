import {arrayToMap} from 'website-scrap-engine/lib/util';
import {Resource, ResourceType} from 'website-scrap-engine/lib/resource';
import type {Cheerio} from 'website-scrap-engine/lib/types';

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
  'ogv', 'mp4', 'flv', 'm4v', 'mkv', 'webm',
  'msi',
  'xpi',
  'rdf',
  'pdf',
  'dia',
  'eot',
  'psd',
  'vtt',
]);

const forceBinarySuffix = [
  '/Learn/CSS/CSS_layout/Flexbox/flexbox_first-child_flex-end.png',
  '/Learn/CSS/CSS_layout/Flexbox/flexbox-example7.png',
  '/Basic_animations/capitan_meadows,_yosemite_national_park.jpg',
  '/docs/Learn/HTML/Cheatsheet/beast.png',
  '/Web/API/HTMLImageElement/sizes/new-york-skyline-wide.jpg',
  '/Web/API/HTMLImageElement/sizes/new-york-skyline-tall.jpg',
  '/Web/API/HTMLImageElement/sizes/new-york-skyline-4by3.jpg',
  '/Web/API/HTMLImageElement/src/grapefruit-slice-332-332.jpg',
  '/Web/API/HTMLMediaElement/textTracks/sample.mp4',
  '/Web/API/HTMLMediaElement/textTracks/sample.ogv',
];

export const detectLinkType = (
  url: string,
  type: ResourceType,
  elem: Cheerio | null,
  parent: Resource | null
): ResourceType => {
  // https://github.com/website-local/mdn-local/issues/214
  if (url.includes('/sitemaps/') && url.endsWith('/sitemap.xml.gz')) {
    return ResourceType.SiteMap;
  }
  for (let len = forceBinarySuffix.length, i = 0; i < len; i++) {
    if (url.endsWith(forceBinarySuffix[i])) {
      return ResourceType.Binary;
    }
  }
  if (url.endsWith('/Add-ons/WebExtensions/manifest.json')) {
    return ResourceType.Html;
  }

  if (!((elem && (elem.is('a') || elem.is('iframe'))) ||
    (parent && (
      parent.type === ResourceType.SiteMap ||
      parent.meta?.mdnIsSearchJson)
    ))) {
    return type;
  }
  if (url.includes('/@api/deki/files/') && !url.endsWith('.html')) {
    return ResourceType.Binary;
  }
  if ((url.includes('/docs/') ||
    url.includes('Add-ons/WebExtensions') ||
    url.includes('Add-ons/Firefox_for_Android') ||
    url.includes('Apps/Build') ||
    url.includes('JavaScript_code_modules/') ||
    url.includes('Creating_XPCOM_Components/Building_the_WebLock_UI')) &&
    // https://github.com/website-local/mdn-local/issues/205
    !url.endsWith('/contributors.txt') &&
    !url.endsWith('/index.json')) {
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
