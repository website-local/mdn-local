browser-compatibility-table
--------------
This dir contains code rewritten from [mdn/yari](https://github.com/mdn/yari/tree/v2.8.8/client/src/document/ingredients/browser-compatibility-table), which is licensed [MPL-2.0](https://github.com/mdn/yari/blob/v0.4.123/LICENSE)

`types.ts` is [types.d.ts](https://unpkg.com/@mdn/browser-compat-data@5.2.38/types.d.ts) from [mdn/browser-compat-data](https://github.com/mdn/browser-compat-data), licensed [CC0](https://github.com/mdn/browser-compat-data/blob/v5.2.38/LICENSE)

Changes
---------------
* Removed react and use functions and js [template strings](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Template_literals).
* Render all history things with hidden elements.
* Render empty and hidden `bc-history`.
* No html escaping now.
* Render `key` to html attribute.
* Removed all event handlers.
* Removed react context and make `browserInfo` an extra function argument.

Note
--------------
The original code of yari uses ES2019 [flat](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/flat) and [flatMap](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap) which is introduced in node.js `11.0.0`.

Files other than `index.ts` and `types.ts` should not be imported out of this dir.
