browser-compatibility-table
--------------
This dir contains code rewritten from [mdn/fred](https://github.com/mdn/fred/tree/fec93002ef5e2a0d9d41d5145bdfda5af5c76f4c/components/compat-table), which is licensed [MPL-2.0](https://github.com/mdn/fred/blob/v1.6.1/LICENSE). Last checked on 2026-09-26 (v2.9.2 plus unreleased compatibility settings and same-page link fixes).

`types.ts` is [types.d.ts](https://unpkg.com/@mdn/browser-compat-data@6.0.7/types.d.ts) from [mdn/browser-compat-data](https://github.com/mdn/browser-compat-data), licensed [CC0](https://github.com/mdn/browser-compat-data/blob/v5.2.38/LICENSE)

Changes
---------------
* All telemetry fully removed.
* Removed lit and render to plain html.
* Issue link removed.
* Recovered types from jsdoc
* Removed all event handlers, which would be moved to inject.js.
* Array maps in html are joined later.
* All html attrs are quoted.
* Rendered null to empty string.
* Branch heading l10n strings (`compat-branch-*`) inlined as English text.
* Browser settings use native HTML controls and injected JS. Applicable columns and legend items are rendered ahead of time, with non-default browsers hidden until selected; changing settings requires no network access.
* Preferences are stored when browser storage is available, with live preview, Save, Cancel, and Restore defaults. Storage failures preserve settings for the current page.
* The document pathname is passed into the renderer to omit links back to the same page while retaining section links.

Note
--------------
The original code of yari uses ES2019 [flat](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/flat) and [flatMap](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap) which is introduced in node.js `11.0.0`, but we are targeting node 18 now.

Files other than `index.ts` and `types.ts` should not be imported out of this dir.
