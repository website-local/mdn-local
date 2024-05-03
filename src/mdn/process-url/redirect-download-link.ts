import type {Resource} from 'website-scrap-engine/lib/resource';
import URI from 'urijs';
import {externalHosts} from './consts';

const replacements = [
  // https://github.com/website-local/mdn-local/issues/938
  'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4',
  // A much smaller file
  'https://mdn.github.io/dom-examples/picture-in-picture/assets/bigbuckbunny.mp4',
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

    for (const externalHost of externalHosts) {
      if (path.startsWith(externalHost.prefix)) {
        // interactive-examples
        // redirect back to real url
        res.downloadLink = uri.search('')
          .protocol(externalHost.protocol)
          .host(externalHost.host)
          .path(path.slice(externalHost.pathPrefixLength))
          .toString();
        if (res.downloadLink === replacements[0]) {
          res.downloadLink = replacements[1];
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
