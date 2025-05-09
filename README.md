# mdn-local
download localized mozilla developer docs to local device

## Summary

`mdn-local` is a project focusing to download the all the accessible docs and examples on [MDN Web Docs](https://developer.mozilla.org/) for a specified locale, and resources required for running and viewing this in local device, or local-area network, making it (mostly) work without any external network access (meaning the internet).

For locales other than `en-US`, `en-US` docs would be fetched for pages not localized (not found on mdn).

## Quick start

Goto [releases](https://github.com/website-local/mdn-local/releases), download a package (not the source code), extract it to some path of your drive, double-click `index.html` and enjoy your docs.

## Usage

`mdn-local` is based on [website-scrap-engine](https://github.com/website-local/website-scrap-engine), the main entry in [mdn-downloader.ts](https://github.com/website-local/mdn-local/blob/0.4.0/src/mdn/mdn-downloader.ts). Below is an example of using it to download mdn docs:

```typescript
import createDownloader from './mdn-downloader.js';

createDownloader({
  // The path to download docs to
  localRoot: '/home/user1000/developer.mozilla.org_20230409_zh-CN',
  meta: {
    // The locale of MDN docs to get
    locale: 'zh-CN',
    // Configure if http2 is enabled for http connection
    http2: false,
    // Configure if ipv6 is prefered on dns lookuping
    preferIpv6: true
  }
}).then(d => d.onIdle().then(() => d.dispose()))
  .catch(console.error);

```

## Large video handling

A set of large videos have been replaced into much smaller alternatives for faster download and smaller size of the package, see [issue #1118](https://github.com/website-local/mdn-local/issues/1118) for more details. Check [here](https://github.com/website-local/assets/releases/tag/mdn-local-video) for a full list of videos that are replaced.
