browser-compatibility-table
--------------
This dir contains code rewritten from [mdn/yari](https://github.com/mdn/yari/blob/v4.11.0/client/src/lit/compat/), which is licensed [MPL-2.0](https://github.com/mdn/yari/blob/v0.4.123/LICENSE)

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

Note
--------------
The original code of yari uses ES2019 [flat](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/flat) and [flatMap](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap) which is introduced in node.js `11.0.0`, but we are targeting node 18 now.

Files other than `index.ts` and `types.ts` should not be imported out of this dir.
