import {describe, expect, test} from '@jest/globals';
import {runInNewContext} from 'node:vm';
import {posix} from 'node:path';
import type {CheerioStatic} from 'website-scrap-engine/lib/types.js';
import type {Resource, ResourceBody} from 'website-scrap-engine/lib/resource.js';
import {ResourceType} from 'website-scrap-engine/lib/resource.js';
import {PipelineExecutorImpl} from 'website-scrap-engine/lib/downloader/pipeline-executor-impl.js';
import {sources} from 'website-scrap-engine/lib/sources.js';
import options from '../../src/mdn/life-cycle.js';
import {classicDemoModule} from '../../src/mdn/process-html/process-demo-modules.js';

function fixture(locale = 'en-US', body: ResourceBody = 'window.ran = true;') {
  const downloaded: Resource[] = [];
  const submitted: Resource[] = [];
  const config = {
    ...options,
    localRoot: '/unused',
    meta: {locale},
    download: [async (res: Resource) => {
      downloaded.push(res);
      return {...res, body};
    }]
  };
  const pipeline = new PipelineExecutorImpl(config, {}, config);
  const parent = pipeline.createResource(ResourceType.Html, 0,
    `https://developer.mozilla.org/${locale}/docs/`,
    `https://developer.mozilla.org/${locale}/docs/`);
  const submit = (resources: Resource | Resource[]) => {
    submitted.push(...Array.isArray(resources) ? resources : [resources]);
  };
  async function process(url: string, html: string, redirectedUrl?: string) {
    const res = await pipeline.createAndProcessResource(
      url, ResourceType.Html, 1, null, parent);
    if (!res) throw new Error('Missing fixture resource');
    const result = await pipeline.processAfterDownload(
      {...res, body: html, redirectedUrl}, submit);
    if (!result) throw new Error('Missing processed resource');
    return {res: result, $: result.meta.doc as CheerioStatic};
  }
  return {pipeline, parent, submitted, downloaded, process};
}

describe('full-download regressions', () => {
  test.each([
    'https://mdn.github.io/dom-examples/fetch/basic-fetch/',
    'https://mdn.github.io/dom-examples/fetch/basic-fetch/index.html',
    'https://mdn.github.io/webassembly-examples/understanding-text-format/add.html',
    'https://mdn.github.io/webaudio-examples/decode-audio-data/promise/',
  ])('keep known runtime-dependent classic demos online: %s', async url => {
    const f = fixture();
    const {$} = await f.process(url,
      '<h1>Example</h1><script>fetch("asset.bin");</script>' +
      '<script src="script.js"></script><script type="application/json">{"value":1}</script>');
    expect($('script:not([type="application/json"])')).toHaveLength(0);
    expect($('script[type="application/json"]').text()).toBe('{"value":1}');
    expect($('.mdn-local-live-example a').attr('href')).toBe(url);
    expect(f.submitted).toHaveLength(0);
    expect(f.downloaded).toHaveLength(0);
    expect($('h1').text()).toBe('Example');
  });

  test.each(['en-US', 'zh-CN'])('rewrite moved image src, srcset and CSS URLs in %s', async locale => {
    const docs = `/${locale}/docs/`;
    const moves = [
      ...['two-axes', 'align-container-subjects', 'writing-mode-start',
        'justify-content-start', 'justify-content-space-between'].map(name => [
        `${docs}Web/CSS/Guides/Box_alignment/${name}.png`,
        `${docs}Web/CSS/Guides/Box_alignment/Overview/${name}.png`
      ]),
      ...[200, 400].map(size => [
        `${docs}Web/HTML/Element/img/clock-demo-${size}px.png`,
        `${docs}Web/HTML/Reference/Elements/img/clock-demo-${size}px.png`
      ]),
      [`${docs}Mozilla/Add-ons/WebExtensions/user_interface/Toolbar_button/browser-action.png`,
        `${docs}Mozilla/Add-ons/WebExtensions/user_interface/browser-action.png`],
      [`${docs}Web/API/WebXR_Device_API/hw-setup.png`,
        `${docs}Web/API/WebVR_API/hw-setup.png`],
      [`${docs}Web/CSS/Reference/Properties/border-image-slice/border-diamonds.png`,
        '/shared-assets/images/examples/border-diamonds.png'],
      [`${docs}Web/HTML/Reference/Elements/th/column-row-span.png`,
        '/shared-assets/images/diagrams/html/table/column-row-span.png'],
      [`${docs}Learn_web_development/Core/Styling_basics/Advanced_styling_effects/colorful-heart.png`,
        '/mdn-github-io/shared-assets/images/examples/colorful-heart.png'],
      [`${docs}Web/API/Canvas_API/Tutorial/Applying_styles_and_colors/canvas-grid.png`,
        `${docs}Web/API/Canvas_API/Tutorial/Drawing_shapes/canvas-grid.png`],
      [`${docs}Web/CSS/Reference/Properties/mask-border/mask-border-diamonds.png`,
        '/mdn-github-io/shared-assets/images/examples/mask-border-diamonds.png'],
      [`${docs}Web/HTML/Element/figure/favicon-192x192.png`,
        `${docs}Web/HTML/Reference/Elements/figure/favicon-192x192.png`],
      [`${docs}Web/API/console/timeLog_static/timer_output.png`,
        `${docs}Web/API/console/timeEnd_static/timer_output.png`]
    ];
    for (const [oldPath, newPath] of moves) {
      const f = fixture(locale);
      const page = `https://developer.mozilla.org${docs}Example`;
      const {$} = await f.process(page,
        `<img src="https://developer.mozilla.org${oldPath}" ` +
        `srcset="${oldPath} 1x, ${oldPath} 2x">` +
        `<style>.example { background-image: url("${oldPath}#sample"); }</style>`);
      expect(f.submitted).toHaveLength(4);
      expect(f.submitted.every(r => r.savePath === 'developer.mozilla.org' + newPath)).toBe(true);
      const expectedDownload = newPath.startsWith('/shared-assets/')
        ? 'https://www.mdnplay.dev' + newPath
        : newPath.startsWith('/mdn-github-io/')
          ? 'https://mdn.github.io' + newPath.slice('/mdn-github-io'.length)
          : 'https://developer.mozilla.org' + newPath;
      expect(f.submitted.every(r => r.downloadLink === expectedDownload)).toBe(true);
      const expectedRelative = posix.relative(`developer.mozilla.org${docs}`, 'developer.mozilla.org' + newPath);
      expect($('img').attr('src')).toBe(expectedRelative);
      expect($('img').attr('srcset')).toBe(`${expectedRelative} 1x, ${expectedRelative} 2x`);
      expect($('style').text()).toContain(`url("${expectedRelative}#sample")`);
    }
  });

  test('leave neighboring assets unchanged', async () => {
    const f = fixture('zh-CN');
    const url = 'https://developer.mozilla.org/zh-CN/docs/Web/CSS/Guides/Box_alignment/other.png';
    expect(await f.pipeline.linkRedirect(url, null, f.parent)).toBe(url);
  });

  test.each(['en-US', 'zh-CN'])('keep WHATWG HTML online and static assets local in %s', async locale => {
    const f = fixture(locale);
    const spec = '/specs/web-apps/current-work/multipage/scripting.html#the-script-element';
    const page = `https://developer.mozilla.org/${locale}/docs/Example`;
    const {$} = await f.process(page,
      `<a href="https://www.whatwg.org${spec}">Specification</a>` +
      '<a href="//www.whatwg.org/html/scripting.html#the-script-element">Legacy</a>' +
      `<a href="/www.whatwg.org${spec}">Internal path</a>` +
      `<a href="https://developer.mozilla.org/www.whatwg.org${spec}">Internal URL</a>` +
      '<a href="../../www.whatwg.org/specs/web-apps/current-work/#the-audio-element">Relative</a>' +
      '<a href="https://www.whatwg.org/">Home</a>' +
      '<a href="https://www.whatwg.org/images/sample.png">Image</a>' +
      '<iframe src="https://www.whatwg.org/demos/workers/modules/page.html"></iframe>' +
      '<img src="https://www.whatwg.org/images/sample.png">' +
      '<img srcset="/www.whatwg.org/images/sample.png 1x, /www.whatwg.org/images/sample2.png 2x">' +
      '<link rel="stylesheet" href="https://www.whatwg.org/style.css">' +
      '<script src="https://www.whatwg.org/script.js"></script>' +
      '<style>.x { background: url("/www.whatwg.org/images/sample.svg#icon"); }</style>');
    expect($('a').slice(0, 6).toArray().map(node => $(node).attr('href'))).toEqual([
      `https://www.whatwg.org${spec}`,
      'https://www.whatwg.org/html/scripting.html#the-script-element',
      `https://www.whatwg.org${spec}`,
      `https://www.whatwg.org${spec}`,
      'https://www.whatwg.org/specs/web-apps/current-work/#the-audio-element',
      'https://www.whatwg.org/'
    ]);
    expect($('iframe')).toHaveLength(0);
    expect($('a.mdn-local-external-iframe-link').attr('href'))
      .toBe('https://www.whatwg.org/demos/workers/modules/page.html');
    expect(f.submitted).toHaveLength(7);
    expect(f.submitted.every(r => r.type !== ResourceType.Html)).toBe(true);
    expect(f.submitted.every(r => r.downloadLink.startsWith('https://www.whatwg.org/'))).toBe(true);
    expect(f.submitted.every(r => r.savePath.startsWith('developer.mozilla.org/www.whatwg.org/'))).toBe(true);
    expect($('img[src]').attr('src')).toBe('../../www.whatwg.org/images/sample.png');
    expect($('link').attr('href')).toBe('../../www.whatwg.org/style.css');
    expect($('script').attr('src')).toBe('../../www.whatwg.org/script.js');
    expect($('style').text()).toContain('../../www.whatwg.org/images/sample.svg#icon');

    const seed = await f.pipeline.createAndProcessResource(
      'https://www.whatwg.org' + spec, ResourceType.Html, 1, null, f.parent);
    expect(seed?.shouldBeDiscardedFromDownload).toBe(true);
    expect(seed?.replacePath).toBe('https://www.whatwg.org' + spec);
    expect(seed && await f.pipeline.download(seed)).toBeUndefined();
    expect(f.downloaded).toHaveLength(0);
  });

  test.each(['en-US', 'zh-CN'])('canonical runner path in %s', async locale => {
    const f = fixture(locale);
    const canonical = `https://developer.mozilla.org/${locale}/docs/Web/API/Element/transitionend_event`;
    const legacy = canonical.replace('/Element/', '/HTMLElement/');
    expect(await f.pipeline.linkRedirect(legacy, null, f.parent)).toBe(canonical);
    const {res, $} = await f.process(legacy,
      '<pre class="html live-sample---example">&lt;button&gt;Run&lt;/button&gt;</pre>' +
      `<iframe data-live-id="example" data-live-path="${new URL(canonical).pathname}"></iframe>`,
      canonical);
    const runner = f.submitted.find(r => r.savePath.includes('/runner-'));
    expect(runner).toBeDefined();
    const parentPath = res.redirectedSavePath || res.savePath;
    expect(parentPath).toBe(new URL(canonical).host + new URL(canonical).pathname + '.html');
    expect(posix.normalize(posix.join(posix.dirname(parentPath), $('iframe').attr('src')!)))
      .toBe(runner!.savePath);
  });

  test.each(['en-US', 'zh-CN'])('canonical DOM image path in %s', async locale => {
    const f = fixture(locale);
    const root = `https://developer.mozilla.org/${locale}/docs/`;
    const resource = await f.pipeline.createAndProcessResource(
      root + 'web/api/document_object_model/example-dom-tree.svg#diagram',
      ResourceType.Binary, 1, null, f.parent);
    expect(resource?.url).toBe(root + 'Web/API/Document_Object_Model/example-dom-tree.svg#diagram');
    expect(resource?.savePath).toContain('/Web/API/Document_Object_Model/');
  });

  test('download team photos while continuing to exclude user profiles', async () => {
    const f = fixture();
    const { $ } = await f.process('https://developer.mozilla.org/en-US/about',
      '<img src="https://mdn.dev/generic-content/about/profiles/joe-309x309@1x.jpg">');
    expect(f.submitted).toHaveLength(1);
    expect(f.submitted[0].downloadLink)
      .toBe('https://mdn.dev/generic-content/about/profiles/joe-309x309@1x.jpg');
    expect($('img').attr('src')).toContain('profiles/joe-309x309@1x.jpg');
    for (const path of ['/en-US/profiles/joe', '/profiles/joe/edit']) {
      const resource = await f.pipeline.createAndProcessResource(
        'https://developer.mozilla.org' + path, ResourceType.Html, 1, null, f.parent);
      expect(resource?.shouldBeDiscardedFromDownload).toBe(true);
    }
  });

  test('discover alternate stylesheet tokens without changing rel or title', async () => {
    const f = fixture();
    const {$} = await f.process('https://mdn.github.io/css-examples/alt-style-sheets/',
      '<link rel="stylesheet" href="base.css">' +
      '<link rel="alternate stylesheet" title="Simple" href="simple.css">' +
      '<link rel="StyleSheet alternate" title="Fancy" href="fancy.css">');
    expect(f.submitted.map(r => r.downloadLink)).toEqual([
      'https://mdn.github.io/css-examples/alt-style-sheets/base.css',
      'https://mdn.github.io/css-examples/alt-style-sheets/simple.css',
      'https://mdn.github.io/css-examples/alt-style-sheets/fancy.css'
    ]);
    expect(f.submitted.every(r => r.type === ResourceType.Css)).toBe(true);
    expect($('link[title="Simple"]').attr('rel')).toBe('alternate stylesheet');
    expect($('link[title="Fancy"]').attr('href')).toBe('fancy.css');
    expect(sources.some(s => s.selector === 'link[rel="stylesheet"][href]')).toBe(true);
  });

  test('leave login links online and never submit challenge pages', async () => {
    const f = fixture();
    const login = '/users/fxa/login/authenticate/?next=%2Fen-US%2F';
    const {$} = await f.process('https://developer.mozilla.org/en-US/blog/introducing-ai-help/',
      `<a href="${login}">Login</a>` +
      `<a href="https://developer.mozilla.org${login}">Login</a>` +
      '<a href="/en-US/docs/users/fxa/login">Documentation</a>');
    expect($('a').eq(0).attr('href')).toBe('https://developer.mozilla.org' + login);
    expect($('a').eq(1).attr('href')).toBe('https://developer.mozilla.org' + login);
    expect(f.submitted.some(r => r.url.includes('/users/fxa/login/authenticate'))).toBe(false);
    expect(f.submitted.some(r => r.url.includes('/docs/users/fxa/login'))).toBe(true);
    expect(await f.pipeline.linkRedirect(login, null, null)).toBeUndefined();
  });

  test('preserve distinct BCD requests with case-insensitive safe saved paths', async () => {
    const f = fixture();
    const resources: Resource[] = [];
    for (const name of ['Crypto', 'crypto', 'Performance', 'performance', 'Scheduler', 'scheduler']) {
      const url = `https://developer.mozilla.org/bcd/api/v0/current/api.${name}.json`;
      const r = await f.pipeline.createAndProcessResource(url, ResourceType.Binary, 1, null, f.parent);
      expect(r?.downloadLink).toBe(url.replace('://developer.', '://bcd.developer.'));
      expect(r?.url).toBe(url);
      resources.push(r!);
    }
    expect(new Set(resources.map(r => r.savePath.toLowerCase())).size).toBe(6);
    const again = await f.pipeline.createAndProcessResource(resources[0].url,
      ResourceType.Binary, 1, null, f.parent);
    expect(again?.savePath).toBe(resources[0].savePath);
    const ordinary = f.pipeline.createResource(ResourceType.Binary, 1,
      'https://developer.mozilla.org/static/Example.json', f.parent.url);
    expect(ordinary.savePath).toBe('developer.mozilla.org/static/Example.json');
  });

  test.each([
    ['getting-started/5_canvas_images/', 'firefox.png'],
    ['loops_animation/7_canvas_walking_animation/index.html', 'walk-right.png'],
  ])('include the known image for %s without disabling its script', async (path, name) => {
    const f = fixture();
    const url = 'https://mdn.github.io/learning-area/javascript/apis/drawing-graphics/' + path;
    const {$} = await f.process(url, '<canvas></canvas><script src="script.js"></script>');
    expect($('script')).toHaveLength(1);
    expect($('.mdn-local-live-example')).toHaveLength(0);
    expect(f.submitted.some(r => r.downloadLink === new URL(name, url).href)).toBe(true);
    expect(f.downloaded).toHaveLength(0);
  });

  test('convert simple demo modules, retaining scope and DOMContentLoaded behavior', async () => {
    const source = 'const secret = 1; window.topThis = this; ' +
      'document.addEventListener("DOMContentLoaded", () => { ' +
      'document.querySelector("button").onclick = () => window.clicked = secret; });';
    const original = Buffer.from(source);
    const f = fixture('en-US', original);
    const {$} = await f.process('https://mdn.github.io/demo/index.html',
      '<script type="module" integrity="old" src="script.js"></script><button>Click</button>');
    const script = $('script');
    expect(script).toHaveLength(1);
    expect(script.attr('type')).toBeUndefined();
    expect(script.attr('integrity')).toBeUndefined();
    expect(script.attr('defer')).toBeDefined();
    expect($('[class*="mdn-local-inject"]')).toHaveLength(0);
    expect(f.downloaded).toHaveLength(1);
    expect(f.submitted.find(r => r.url.endsWith('script.js'))?.body).toBe(original);
    const callbacks: (() => void)[] = [];
    const button = {onclick: () => {}};
    const context = {window: {} as Record<string, unknown>, document: {
      addEventListener: (event: string, fn: () => void) => {
        if (event === 'DOMContentLoaded') callbacks.push(fn);
      },
      querySelector: () => button
    }};
    const converted = Buffer.from(script.attr('src')!.split(',')[1], 'base64').toString();
    runInNewContext(converted, context);
    expect(context.window.topThis).toBeUndefined();
    expect('secret' in context).toBe(false);
    expect(callbacks).toHaveLength(1);
    callbacks.forEach(fn => fn());
    button.onclick();
    expect(context.window.clicked).toBe(1);
  });

  test('preserve async and execute repeated external module URLs once', async () => {
    const f = fixture();
    const {$} = await f.process('https://mdn.github.io/demo/',
      '<script type="module" async src="script.js"></script>' +
      '<script type="module" src="./script.js"></script>');
    expect($('script')).toHaveLength(1);
    expect($('script').attr('async')).toBeDefined();
    expect(f.downloaded).toHaveLength(1);
  });

  test.each(['import "./other.js";', 'export const value = 1;',
    'await Promise.resolve();', 'window.base = import.meta.url;', 'broken {',
    'window.args = arguments;', 'window.script = document.currentScript;'])(
    'explicit live fallback for %s', async source => {
      const f = fixture('en-US', source);
      const {$} = await f.process('https://mdn.github.io/demo/',
        '<script type="module" src="script.js"></script>' +
      '<script type="module">import "./second.js";</script><button>Demo</button>');
      expect($('script')).toHaveLength(0);
      expect($('.mdn-local-live-example')).toHaveLength(1);
      expect($('.mdn-local-live-example a').attr('href')).toBe('https://mdn.github.io/demo/');
      expect($('button')).toHaveLength(1);
      expect(f.submitted.some(r => r.type === ResourceType.Html)).toBe(false);
    });

  test('a failed module fetch does not prevent later simple modules', async () => {
    const f = fixture();
    f.pipeline.download = async () => { throw new Error('timeout'); };
    const {$} = await f.process('https://mdn.github.io/demo/',
      '<script type="module" src="missing.js"></script>' +
      '<script type="module">window.inlineRan = true;</script>');
    expect($('.mdn-local-live-example')).toHaveLength(1);
    expect($('script[src^="data:"]')).toHaveLength(1);
  });

  test.each([
    'const response = await fetch("subpage.html");',
    'navigation.addEventListener("navigate", e => { e.intercept({ async handler() { await fetch(e.destination.url); } }); });',
    'const texture = new Image(); texture.src = "https://cdn.example.com/texture.png";',
    'window.fetch("data.json");',
    'const request = new XMLHttpRequest(); request.open("GET", "data.json");',
    'const worker = new Worker("worker.js");',
    'const socket = new WebSocket("wss://example.com");'
  ])('use a live link for runtime dependencies: %s', async source => {
    const f = fixture('en-US', source);
    const {$} = await f.process('https://mdn.github.io/demo/',
      '<script type="module" src="script.js"></script>' +
      '<script type="module">window.staticPreview = true;</script><button>Demo</button>');
    const scripts = $('script[src^="data:"]');
    expect(scripts).toHaveLength(1);
    const converted = Buffer.from(scripts.attr('src')!.split(',')[1], 'base64').toString();
    expect(converted).toContain('window.staticPreview = true;');
    expect($('.mdn-local-live-example')).toHaveLength(1);
    expect($('.mdn-local-live-example').text()).toContain('resources that are unavailable offline');
    expect($('.mdn-local-live-example a').attr('href')).toBe('https://mdn.github.io/demo/');
    expect($('[class*="mdn-local-inject"]')).toHaveLength(0);
    expect($('button')).toHaveLength(1);
    expect(f.submitted.find(r => r.url.endsWith('script.js'))?.body).toBe(source);
  });

  test('continue replacing real MDN frontend modules with offline helpers', async () => {
    const f = fixture();
    const {$} = await f.process('https://developer.mozilla.org/en-US/docs/Web/API/Element',
      '<script type="module" src="/static/client/main.js"></script>');
    expect($('script[type="module"]')).toHaveLength(0);
    expect($('script.mdn-local-inject-js')).toHaveLength(1);
    expect($('link.mdn-local-inject-css')).toHaveLength(1);
    expect($('.mdn-local-live-example')).toHaveLength(0);
    expect(f.downloaded).toHaveLength(0);
  });

  test('compiling a module never executes downloaded code', () => {
    expect(classicDemoModule('throw new Error("must not run");')).toContain('must not run');
  });
});
