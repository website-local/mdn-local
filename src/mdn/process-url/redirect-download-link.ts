import type {Resource} from 'website-scrap-engine/lib/resource';
import {largeMp4Videos, largeWebmVideos} from './consts';
import URI from 'urijs';

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
    if (path.startsWith('/interactive-examples/')) {
      // interactive-examples
      // redirect back to real url
      res.downloadLink = uri.search('')
        .host('interactive-examples.mdn.mozilla.net')
        .path(path.slice('/interactive-examples'.length))
        .toString();
      return res;
    }
    if (path.startsWith('/mdn-github-io/')) {
      // mdn.github.io
      // redirect back to real url
      path = path.slice('/mdn-github-io'.length);
      // redirect large videos to small ones
      // https://github.com/myfreeer/mdn-local/issues/46
      if (largeMp4Videos[path]) {
        path = '/learning-area/html/multimedia-and-embedding/' +
          'video-and-audio-content/rabbit320.mp4';
      } else if (largeWebmVideos[path]) {
        path = '/learning-area/html/multimedia-and-embedding/' +
          'video-and-audio-content/rabbit320.webm';
      }
      res.downloadLink = uri.search('')
        .host('mdn.github.io')
        .path(path)
        .toString();
      return res;
    }
    if (path.startsWith('/unpkg-com/')) {
      // unpkg.com
      // redirect back to real url
      res.downloadLink = uri.search('')
        .host('unpkg.com')
        .path(path.slice('/unpkg-com'.length))
        .toString();
      return res;
    }

    // https://github.com/website-local/mdn-local/issues/361
    // cdnjs.cloudflare.com
    if (path.startsWith('/cdnjs-cloudflare-com/')) {
      // unpkg.com
      // redirect back to real url
      res.downloadLink = uri.search('')
        .host('cdnjs.cloudflare.com')
        .path(path.slice('/cdnjs-cloudflare-com'.length))
        .toString();
      return res;
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
  }
  return res;
};
