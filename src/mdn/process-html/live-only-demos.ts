// Exact external demo pages with missing JavaScript-loaded resources in the
// 2026-10-01 archives. Their fetch/worker/legacy API behavior needs an online
// origin; keep the static page and offer the live example instead of running it.
export const liveOnlyDemoPaths: ReadonlySet<string> = new Set([
  '/dom-examples/canvas/pixel-manipulation/color-manipulation.html',
  '/dom-examples/canvas/pixel-manipulation/color-picker.html',
  '/dom-examples/fetch/basic-fetch/',
  '/dom-examples/fetch/fetch-json/',
  '/dom-examples/fetch/fetch-response-clone/',
  '/webassembly-examples/js-api-examples/',
  '/webassembly-examples/js-api-examples/compile-streaming.html',
  '/webassembly-examples/js-api-examples/global.html',
  '/webassembly-examples/js-api-examples/imports.html',
  '/webassembly-examples/js-api-examples/index-compile.html',
  '/webassembly-examples/js-api-examples/instantiate-streaming.html',
  '/webassembly-examples/js-api-examples/memory.html',
  '/webassembly-examples/js-api-examples/table.html',
  '/webassembly-examples/js-api-examples/table2.html',
  '/webassembly-examples/js-api-examples/validate.html',
  '/webassembly-examples/js-builtin-examples/compile-streaming/',
  '/webassembly-examples/js-builtin-examples/compile/',
  '/webassembly-examples/js-builtin-examples/instantiate-streaming/',
  '/webassembly-examples/js-builtin-examples/instantiate/',
  '/webassembly-examples/js-builtin-examples/module-constructor/',
  '/webassembly-examples/js-builtin-examples/validate/',
  '/webassembly-examples/other-examples/custom-section.html',
  '/webassembly-examples/other-examples/table-set.html',
  '/webassembly-examples/understanding-text-format/add.html',
  '/webassembly-examples/understanding-text-format/logger.html',
  '/webassembly-examples/understanding-text-format/logger2.html',
  '/webassembly-examples/understanding-text-format/multi-memory.html',
  '/webassembly-examples/understanding-text-format/shared-address-space.html',
  '/webassembly-examples/understanding-text-format/wasm-table.html',
  '/webaudio-examples/audio-buffer-source-node/loop/',
  '/webaudio-examples/audio-buffer-source-node/playbackrate/',
  '/webaudio-examples/decode-audio-data/callback/',
  '/webaudio-examples/decode-audio-data/promise/',
  '/webaudio-examples/offline-audio-context-promise/',
  '/webaudio-examples/output-timestamp/',
  '/webaudio-examples/panner-node/',
  '/webaudio-examples/script-processor-node/',
  '/webvr-tests/webvr/raw-webgl-controller-example/',
  '/webvr-tests/webvr/raw-webgl-example/',
]);

// These two image-only demos can retain their ordinary scripts offline.
export const demoImageAssets: Readonly<Record<string, readonly string[]>> = {
  '/learning-area/javascript/apis/drawing-graphics/getting-started/5_canvas_images/':
    ['firefox.png'],
  '/learning-area/javascript/apis/drawing-graphics/loops_animation/7_canvas_walking_animation/':
    ['walk-right.png'],
};
