import type {Resource} from 'website-scrap-engine/lib/resource.js';
import URI from 'urijs';
import {externalHosts} from './consts.js';

// updated 20250503
// https://github.com/website-local/mdn-local/issues/1118
// https://github.com/website-local/assets/releases/tag/mdn-local-video
const replacements = [
  'https://archive.org/download/ElephantsDream/ed_hd.avi',
  'https://website-local.github.io/assets/ed_hd.avi',
  'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4',
  'https://website-local.github.io/assets/ed_1024_512kb.mp4',
  'https://archive.org/download/ElephantsDream/ed_hd.ogv',
  'https://website-local.github.io/assets/ed_hd.ogv',
  'https://mdn.github.io/dom-examples/picture-in-picture/assets/bigbuckbunny.mp4',
  'https://website-local.github.io/assets/bigbuckbunny.mp4',
  'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4',
  'https://website-local.github.io/assets/bigbuckbunny.mp4',
  'https://mdn.github.io/dom-examples/fullscreen-api/assets/bigbuckbunny.mp4',
  'https://website-local.github.io/assets/bigbuckbunny.mp4',
  'https://mdn.github.io/dom-examples/document-picture-in-picture/assets/bigbuckbunny.mp4',
  'https://website-local.github.io/assets/bigbuckbunny.mp4',
  'https://mdn.github.io/imsc-examples/videos/coffee.mp4',
  'https://website-local.github.io/assets/coffee.mp4',
  'https://mdn.github.io/imsc-examples/videos/stars.mp4',
  'https://website-local.github.io/assets/stars.mp4',
  'https://mdn.github.io/learning-area/javascript/apis/video-audio/finished/video/sintel-short.mp4',
  'https://website-local.github.io/assets/sintel-short.mp4',
  'https://mdn.github.io/html-examples/link-rel-preload/video/sintel-short.mp4',
  'https://website-local.github.io/assets/sintel-short.mp4',
  'https://mdn.github.io/learning-area/javascript/apis/video-audio/finished/video/sintel-short.webm',
  'https://website-local.github.io/assets/sintel-short.webm',
  'https://mdn.github.io/html-examples/link-rel-preload/video/sintel-short.webm',
  'https://website-local.github.io/assets/sintel-short.webm',
  'https://developer.mozilla.org/shared-assets/videos/sintel-short.mp4',
  'https://website-local.github.io/assets/sintel-short.mp4',
  'https://developer.mozilla.org/shared-assets/videos/sintel-short.webm',
  'https://website-local.github.io/assets/sintel-short.webm',
  'https://www.mdnplay.dev/shared-assets/videos/tears-of-steel-battle-clip-medium.mp4',
  'https://website-local.github.io/assets/tears-of-steel-battle-clip-medium.mp4',
  'https://www.mdnplay.dev/shared-assets/videos/tears-of-steel-battle-clip-medium.ogg',
  'https://website-local.github.io/assets/tears-of-steel-battle-clip-medium.ogg',
  'https://www.mdnplay.dev/shared-assets/videos/tears-of-steel-battle-clip-medium.webm',
  'https://website-local.github.io/assets/tears-of-steel-battle-clip-medium.webm',
];

export const redirectDownloadLink = (res: Resource): Resource => {
  const url = res.downloadLink;
  let uri, path;
  if ((uri = URI(url)) &&
    uri.host() === 'developer.mozilla.org' &&
    (path = uri.path())) {
    if (path.includes('/docs/') && path.includes('$samples/')) {
      // probably example iframe
      res.downloadLink = uri.search('').host('mdn.mozillademos.org').toString();
      return res;
    }
    if (path.startsWith('/files/') && path.match(/^\/files\/\d+\//i)) {
      // static files
      res.downloadLink = uri.search('').host('mdn.mozillademos.org').toString();
      return res;
    }
    if (path.startsWith('/shared-assets/')) {
      // 20250303 shared assets
      res.downloadLink = uri.search('').host('www.mdnplay.dev').toString();
      for (let i = 0; i < replacements.length; i += 2) {
        if (res.downloadLink === replacements[i]) {
          res.downloadLink = replacements[i + 1];
          break;
        }
      }
      return res;
    }

    for (const externalHost of externalHosts) {
      if (path.startsWith(externalHost.prefix)) {
        // interactive-examples
        // redirect back to real url
        res.downloadLink = uri.search('')
          .protocol(externalHost.protocol)
          .host(externalHost.host)
          .path(path.slice(externalHost.pathPrefixLength))
          .toString();
        for (let i = 0; i < replacements.length; i += 2) {
          if (res.downloadLink === replacements[i]) {
            res.downloadLink = replacements[i + 1];
            break;
          }
        }
        return res;
      }
    }

    // https://github.com/website-local/mdn-local/issues/208
    if (path.startsWith('/mdn.mozit.cloud/')) {
      const pathArr = path.split('/');
      res.downloadLink = uri.search('')
        .host(pathArr[2])
        .path(path.slice('/mdn.mozit.cloud/'.length + pathArr[2].length))
        .toString();
      return res;
    }
    // https://github.com/mdn/yari/commit/6e9fb23dad1571a463e06db7e280e6479b2582bd
    // https://github.com/website-local/mdn-local/issues/890
    // 20230716
    if (path.startsWith('/bcd/api/v0/')) {
      res.downloadLink = uri.search('')
        .host('bcd.developer.mozilla.org')
        .toString();
      return res;
    }
    // https://github.com/website-local/mdn-local/issues/891
    // 20230716
    if (path.startsWith('/live.mdnplay.dev/')) {
      res.downloadLink = uri.search('')
        .host('live.mdnplay.dev')
        .path(path.slice('/live.mdnplay.dev'.length))
        .toString();
      return res;
    }
  }
  return res;
};
