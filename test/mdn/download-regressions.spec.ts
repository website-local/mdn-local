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
