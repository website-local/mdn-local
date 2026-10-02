// Exact external demo pages reviewed in the 2026-10-01/02 archives.
// Their fetch/worker/legacy API behavior needs an online
// origin; keep the static page and offer the live example instead of running it.
export const liveOnlyDemoPaths: ReadonlySet<string> = new Set([
  '/dom-examples/canvas/pixel-manipulation/color-manipulation.html',
  '/dom-examples/canvas/pixel-manipulation/color-picker.html',
  '/dom-examples/fetch/basic-fetch/',
  '/dom-examples/fetch/fetch-json/',
  '/dom-examples/fetch/fetch-request/',
  '/dom-examples/fetch/fetch-request-with-init/',
  '/dom-examples/fetch/fetch-response/',
  '/dom-examples/fetch/fetch-response-clone/',
  '/dom-examples/file-system-api/createsyncaccesshandle-mode/',
  '/dom-examples/web-workers/fibonacci-worker/',
  '/dom-examples/web-workers/offscreen-canvas-worker/',
  '/dom-examples/web-workers/simple-web-worker/',
  '/dom-examples/web-workers/simple-shared-worker/',
  '/dom-examples/web-workers/worker-playground/',
  '/learning-area/javascript/asynchronous/workers/finished/',
  // Saving this texture still fails WebGL uploads under normal file security.
  '/learning-area/javascript/apis/drawing-graphics/threejs-cube/',
  '/pwa-examples/js13kpwa/',
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
  '/webassembly-examples/js-api-examples/xhr-wasm.html',
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
  '/webaudio-examples/iirfilter-node/',
  '/webaudio-examples/offline-audio-context-promise/',
  '/webaudio-examples/output-timestamp/',
  '/webaudio-examples/panner-node/',
  '/webaudio-examples/script-processor-node/',
  '/webaudio-examples/step-sequencer/',
  '/webvr-tests/webvr/raw-webgl-controller-example/',
  '/webvr-tests/webvr/raw-webgl-example/',
]);

// Reviewed sibling assets loaded by these demos' scripts, including shadow DOM
// resources. Keep exact page paths so ordinary scripts can run unchanged offline.
export const demoAssets: Readonly<Record<string, readonly string[]>> = {
  '/beginner-html-site-scripted/': ['images/firefox2.png'],
  '/dom-examples/web-storage/':
    ['jscolor/hs.png', 'jscolor/hv.png', 'jscolor/cross.gif', 'jscolor/arrow.gif'],
  '/dom-examples/window-management-api/': ['popups-blocked.png'],
  '/dom-examples/view-transitions/spa/': [
    'images/jungle-coast.jpg', 'images/jungle-coast_th.jpg',
    'images/tree-bird.jpg', 'images/tree-bird_th.jpg',
    'images/view-from-the-sky.jpg', 'images/view-from-the-sky_th.jpg',
    'images/watery-view.jpg', 'images/watery-view_th.jpg',
  ],
  '/learning-area/javascript/building-blocks/gallery/':
    ['images/pic2.jpg', 'images/pic3.jpg', 'images/pic4.jpg', 'images/pic5.jpg'],
  '/learning-area/javascript/apis/drawing-graphics/getting-started/5_canvas_images/':
    ['firefox.png'],
  '/learning-area/javascript/apis/drawing-graphics/loops_animation/7_canvas_walking_animation/':
    ['walk-right.png'],
  '/web-components-examples/popup-info-box-web-component/':
    ['img/alt.png', 'img/default.png'],
  '/web-components-examples/popup-info-box-external-stylesheet/':
    ['img/alt.png', 'img/default.png', 'style.css'],
};
