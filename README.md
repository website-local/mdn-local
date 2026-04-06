# mdn-local
download localized mozilla developer docs to local device

## Summary

`mdn-local` downloads [MDN Web Docs](https://developer.mozilla.org/) for offline
use. It creates a self-contained local copy of a selected locale together with
the resources needed to view docs, examples, compatibility tables, and injected
offline helpers without relying on the public site at runtime.

For locales other than `en-US`, `en-US` pages are used as a fallback when a
localized page does not exist.

## Quick start

Go to [releases](https://github.com/website-local/mdn-local/releases), download
an archive package instead of the source tarball, extract it somewhere on your
disk, then open `index.html`.

## Using a release package

If you downloaded a prebuilt archive from the releases page, you do not need
Node.js or a build step.

1. Extract the archive to a local directory.
2. Open `developer.mozilla.org/index.html` if it exists in the extracted
   package.
3. If the package contains a top-level `index.html`, open that file instead.

The packaged docs are intended to work directly from the local filesystem for
offline browsing.

## Build from source

Node.js `>=18.17.0` is required.

```bash
npm ci
npm run build
```

Useful commands:

- `npm run build` builds `lib/` and copies non-TypeScript assets
- `npm test` runs lint and Jest
- `npm run lint` applies ESLint fixes to `src/` and `test/`
- `npm run tsc` runs the TypeScript compiler only

## Developer usage

`mdn-local` is built on top of
[website-scrap-engine](https://github.com/website-local/website-scrap-engine).
The main entry point is
[src/mdn/mdn-downloader.ts](https://github.com/website-local/mdn-local/blob/master/src/mdn/mdn-downloader.ts).

Example probe download:

```typescript
import createDownloader from './lib/mdn/mdn-downloader.js';

createDownloader({
  // Output directory
  localRoot: 'temp/developer.mozilla.org_probe_en-US',
  // Minimal scope for a smoke test
  initialUrl: [
    'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API'
  ],
  maxDepth: 0,
  deduplicateStripSearch: true,
  meta: {
    locale: 'en-US',
    http2: false,
  }
}).then(d => d.onIdle().then(() => d.dispose()))
  .catch(console.error);
```

Full locale download:

```typescript
import createDownloader from './lib/mdn/mdn-downloader.js';

createDownloader({
  // Output directory
  localRoot: 'temp/developer.mozilla.org_zh-CN',
  // Omit initialUrl to use mdn-local's built-in locale entry set
  concurrency: 15,
  minConcurrency: 11,
  req: {
    retry: {
      limit: 42
    }
  },
  meta: {
    locale: 'zh-CN',
    http2: false,
  }
}).then(d => d.onIdle().then(() => d.dispose()))
  .catch(console.error);
```

Notes:

- Build first with `npm run build`, then run your script with `node`.
- If `initialUrl` is omitted, `mdn-local` uses its built-in starting URLs for
  the selected locale and performs a broad crawl from there.
- Full locale downloads are large and long-running. Expect many hours of work
  and a large output tree under `<localRoot>/developer.mozilla.org/`.
- After the download completes, open
  `<localRoot>/developer.mozilla.org/index.html`.

## Output layout

Generated files are written under `<localRoot>/developer.mozilla.org/`.

- Localized HTML pages are stored under paths such as
  `en-US/docs/.../*.html`
- Injected assets are stored under `static/js/` and `static/css/`
- Download logs are stored under `developer.mozilla.org/logs/`

Important log files:

- `error.log`
- `404.log`
- `retry.log`
- `skip.log`
- `request.log`
- `response.log`

As of `website-scrap-engine@0.9.0`, file logging is configured explicitly
through the engine's `createLogger` hook. `mdn-local` keeps using the log4js
adapter so these log files continue to be generated for download validation.

## Which path to use

- Use a release package if you only want to read the offline docs.
- Build from source if you want to generate a new locale snapshot, run tests,
  or change the downloader behavior.

## Large video handling

A set of large videos have been replaced with much smaller alternatives for
faster download and smaller packages. See
[issue #1118](https://github.com/website-local/mdn-local/issues/1118) for
details and the
[asset release](https://github.com/website-local/assets/releases/tag/mdn-local-video)
for the full list.
