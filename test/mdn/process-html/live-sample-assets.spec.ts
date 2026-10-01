import {describe, expect, jest, test} from '@jest/globals';
import {posix} from 'node:path';
import {runInNewContext} from 'node:vm';
import type {Resource, ResourceBody} from 'website-scrap-engine/lib/resource.js';
import {ResourceType} from 'website-scrap-engine/lib/resource.js';
import {PipelineExecutorImpl} from 'website-scrap-engine/lib/downloader/pipeline-executor-impl.js';
import type {CheerioStatic} from 'website-scrap-engine/lib/types.js';
import options from '../../../src/mdn/life-cycle.js';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 2, 0xff, 0xd9]);

function fixture(locale: string, body: ResourceBody | null = jpeg) {
  const submitted: Resource[] = [];
  const config = {...options, localRoot: '/unused', meta: {locale}};
  const pipeline = new PipelineExecutorImpl(config, {}, config);
  const download = jest.fn(async (res: Resource) => body === null ? undefined : {...res, body});
  pipeline.download = download;
  async function process(slug: string, html: string) {
    const url = `https://developer.mozilla.org/${locale}/docs/${slug}`;
    const res = pipeline.createResource(ResourceType.Html, 0, url, url);
    const out = await pipeline.processAfterDownload({...res, body: html}, resources => {
      submitted.push(...Array.isArray(resources) ? resources : [resources]);
    });
    if (!out) throw new Error('Missing result');
    return out.meta.doc as CheerioStatic;
  }
  return {process, submitted, pipeline, download};
}

function sample(locale: string, slug: string, js: string) {
  return '<pre class="html live-sample---demo">&lt;canvas&gt;&lt;/canvas&gt;</pre>' +
    `<pre class="js live-sample---demo">${js}</pre>` +
    `<iframe data-live-id="demo" data-live-path="/${locale}/docs/${slug}/"></iframe>`;
}

describe.each(['en-US', 'zh-CN'])('scoped sample assets in %s', locale => {
  test('queue sibling images that JavaScript loads without changing the sample', async () => {
    const f = fixture(locale);
    const slug = 'Web/API/Canvas_API/Tutorial/Basic_animations';
    const js = ['sun', 'moon', 'earth'].map(name =>
      `new Image().src = "canvas_${name}.png";`).join('\n');
    const $ = await f.process(slug, sample(locale, slug, js));
    expect($('pre.js').text()).toBe(js);
    const runner = f.submitted.find(r => r.savePath.includes('/runner-'))!;
    const doc = runner.meta.doc as CheerioStatic;
    const requested: string[] = [];
    runInNewContext(doc('#mdn-play-js').text(), {
      Image: class {set src(value: string) {requested.push(value);}}
    });
    expect(requested).toHaveLength(3);
    for (const url of requested) {
      const saved = posix.join(posix.dirname(runner.savePath), url);
      expect(f.submitted.some(r => r.savePath === saved &&
        r.downloadLink === `https://${saved}`)).toBe(true);
    }
    expect(f.submitted.filter(r => r.type === ResourceType.Binary)).toHaveLength(4);
  });

  test('retain the old pattern filename for executable JS and redirect article images', async () => {
    const f = fixture(locale);
    const slug = 'Web/API/CanvasRenderingContext2D/createPattern';
    const $ = await f.process(slug,
      `<img src="/${locale}/docs/${slug}/canvas_createpattern.png">` +
      sample(locale, slug, 'new Image().src = "canvas_createpattern.png";'));
    expect($('img').attr('src')).toBe('createPattern/canvas_create_pattern.png');
    const alias = f.submitted.find(r => r.savePath.endsWith('/canvas_createpattern.png'))!;
    expect(alias.downloadLink)
      .toBe(`https://developer.mozilla.org/${locale}/docs/${slug}/canvas_create_pattern.png`);
    expect(f.submitted.some(r => r.downloadLink.endsWith('/canvas_createpattern.png'))).toBe(false);
  });

  test('embed the scoped image for CORS-safe execution and preserve its local copy', async () => {
    const f = fixture(locale);
    const slug = 'Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas';
    const js = 'const img = new Image(); img.crossOrigin = "anonymous"; ' +
      'img.src = "/shared-assets/images/examples/rhino.jpg";';
    const $ = await f.process(slug, sample(locale, slug, js));
    const runner = f.submitted.find(r => r.savePath.includes('/runner-'))!;
    expect((runner.meta.doc as CheerioStatic)('#mdn-play-js').text())
      .toBe('const img = new Image(); img.crossOrigin = "anonymous"; ' +
        `img.src = "data:image/jpeg;base64,${jpeg.toString('base64')}";`);
    expect($('pre.js').text()).toBe(js);
    const asset = f.submitted.find(r => r.savePath.endsWith('/rhino.jpg'))!;
    expect(asset.downloadLink).toBe('https://www.mdnplay.dev/shared-assets/images/examples/rhino.jpg');
    expect(asset.savePath).toBe(posix.join(posix.dirname(runner.savePath), 'rhino.jpg'));
    expect(asset.body).toBe(jpeg);
    expect(f.download).toHaveBeenCalledTimes(1);
  });

  test('do not collect an unrelated page or child directory', async () => {
    const f = fixture(locale);
    await f.process('Web/API/Canvas_API/Tutorial/Basic_animations/Other', '<p>No sample</p>');
    expect(f.submitted).toEqual([]);
  });

  test('localize a known absolute image URL without rewriting similar URLs', async () => {
    const f = fixture(locale);
    const slug = 'Web/API/Canvas_API/Tutorial/Using_images';
    const url = 'https://mdn.github.io/shared-assets/images/examples/rhino.jpg';
    const js = `new Image().src = '${url}'; console.log("${url}?unrelated");`;
    const $ = await f.process(slug, sample(locale, slug, js));
    expect($('pre.js').text()).toBe(js);
    const runner = f.submitted.find(r => r.savePath.includes('/runner-'))!;
    expect((runner.meta.doc as CheerioStatic)('#mdn-play-js').text())
      .toBe(`new Image().src = 'rhino.jpg'; console.log("${url}?unrelated");`);
    const asset = f.submitted.find(r => r.savePath.endsWith('/rhino.jpg'))!;
    expect(asset.downloadLink).toBe(url);
    expect(asset.savePath).toBe(posix.join(posix.dirname(runner.savePath), 'rhino.jpg'));
  });

  test('replace unsupported WAT samples with live links while later JS samples still run', async () => {
    const f = fixture(locale);
    const slug = 'WebAssembly/Reference/Numeric/add';
    const $ = await f.process(slug,
      '<pre class="wat live-sample---wasm">(module)</pre>' +
      '<pre class="js live-sample---wasm">fetch("{%wasm-url%}");</pre>' +
      `<iframe data-live-id="wasm" data-live-path="/${locale}/docs/${slug}/"></iframe>` +
      sample(locale, slug, 'console.log(1 + 2);'));
    expect($('pre.wat').text()).toBe('(module)');
    expect($('.mdn-local-live-sample a').attr('href'))
      .toBe(`https://developer.mozilla.org/${locale}/docs/${slug}#wasm`);
    expect($('.mdn-local-live-sample').attr('data-live-sample-index')).toBeUndefined();
    expect($('iframe')).toHaveLength(1);
    const runners = f.submitted.filter(r => r.savePath.includes('/runner-'));
    expect(runners).toHaveLength(1);
    expect((runners[0].meta.doc as CheerioStatic)('#mdn-play-js').text()).toBe('console.log(1 + 2);');
    expect(f.submitted.some(r => r.url.includes('wasm-url'))).toBe(false);
  });

  test('replace a placeholder even when its WAT block is missing', async () => {
    const f = fixture(locale);
    const slug = 'WebAssembly/Reference/Numeric/add';
    const $ = await f.process(slug, sample(locale, slug, 'fetch("{%wasm-url%}");'));
    expect($('iframe')).toHaveLength(0);
    expect($('.mdn-local-live-sample a')).toHaveLength(1);
    expect(f.submitted).toHaveLength(0);
  });
});

describe('embedded sample image failures and binary bodies', () => {
  const slug = 'Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas';

  test.each([
    ['ArrayBuffer', Uint8Array.from(jpeg).buffer],
    ['offset view', new DataView(Uint8Array.from([0, ...jpeg, 0]).buffer, 1, jpeg.length)],
  ])('encode the exact bytes of an %s response once for multiple runners', async (_, body) => {
    const f = fixture('en-US', body);
    const js = 'new Image().src = "rhino.jpg";';
    await f.process(slug, sample('en-US', slug, js) +
      sample('en-US', slug, js).replaceAll('demo', 'second'));
    expect(f.download).toHaveBeenCalledTimes(1);
    const runners = f.submitted.filter(r => r.savePath.includes('/runner-'));
    expect(runners).toHaveLength(2);
    for (const runner of runners) {
      expect((runner.meta.doc as CheerioStatic)('#mdn-play-js').text())
        .toBe(`new Image().src = "data:image/jpeg;base64,${jpeg.toString('base64')}";`);
    }
    expect(f.submitted.find(r => r.savePath.endsWith('/rhino.jpg'))?.body).toBe(body);
  });

  test.each([
    ['unavailable', null],
    ['empty', Buffer.alloc(0)],
    ['HTML error', Buffer.from('<html>Error</html>')],
  ])('show a live link for an %s image while later samples still run', async (_, body) => {
    const f = fixture('en-US', body);
    const js = 'new Image().src = "/shared-assets/images/examples/rhino.jpg";';
    const $ = await f.process(slug, sample('en-US', slug, js) +
      sample('en-US', slug, 'console.log(1);').replaceAll('demo', 'second'));
    expect($('.mdn-local-live-sample a').attr('href'))
      .toBe(`https://developer.mozilla.org/en-US/docs/${slug}#demo`);
    expect($('pre.js').first().text()).toBe(js);
    expect($('iframe')).toHaveLength(1);
    expect(f.submitted.filter(r => r.type === ResourceType.Binary)).toHaveLength(0);
    expect(f.submitted.filter(r => r.savePath.includes('/runner-'))).toHaveLength(1);
  });

  test('handle a rejected image download without failing the page', async () => {
    const f = fixture('en-US');
    f.download.mockRejectedValueOnce(new Error('timeout'));
    const $ = await f.process(slug, sample('en-US', slug, 'new Image().src = "rhino.jpg";'));
    expect($('.mdn-local-live-sample a')).toHaveLength(1);
    expect($('iframe')).toHaveLength(0);
    expect(f.submitted).toHaveLength(0);
  });

  test('preserve the encoding of a string image body in its saved alias', async () => {
    const f = fixture('en-US');
    const body = jpeg.toString('latin1');
    f.download.mockImplementation(async res => ({...res, body, encoding: 'latin1'}));
    await f.process(slug, sample('en-US', slug, 'new Image().src = "rhino.jpg";'));
    const asset = f.submitted.find(r => r.savePath.endsWith('/rhino.jpg'))!;
    expect(asset.body).toBe(body);
    expect(asset.encoding).toBe('latin1');
    const runner = f.submitted.find(r => r.savePath.includes('/runner-'))!;
    expect((runner.meta.doc as CheerioStatic)('#mdn-play-js').text())
      .toContain(`data:image/jpeg;base64,${jpeg.toString('base64')}`);
  });

  test('show a live link when the image resource is skipped', async () => {
    const f = fixture('en-US');
    jest.spyOn(f.pipeline, 'createAndProcessResource').mockResolvedValueOnce(undefined);
    const $ = await f.process(slug, sample('en-US', slug, 'new Image().src = "rhino.jpg";'));
    expect($('.mdn-local-live-sample a')).toHaveLength(1);
    expect(f.download).not.toHaveBeenCalled();
    expect(f.submitted).toHaveLength(0);
  });
});

describe('marching-ants runner correction', () => {
  const slug = 'Web/API/Canvas_API/Tutorial/Applying_styles_and_colors';
  const js = 'const ctx = document.getElementById("my-canvas").getContext("2d");\n' +
    'ctx.clearRect(0, 0, canvas.width, canvas.height);';

  test('use the context canvas without changing the displayed example', async () => {
    const f = fixture('en-US');
    const $ = await f.process(slug,
      sample('en-US', slug, js).replaceAll('demo', 'using_line_dashes'));
    const runner = f.submitted.find(r => r.savePath.includes('/runner-'))!;
    const clearRect = jest.fn();
    runInNewContext((runner.meta.doc as CheerioStatic)('#mdn-play-js').text(), {
      document: {getElementById: () => ({getContext: () => ({
        canvas: {width: 111, height: 111}, clearRect,
      })})},
    });
    expect(clearRect).toHaveBeenCalledWith(0, 0, 111, 111);
    expect($('pre.js').text()).toBe(js);
  });

  test.each([
    ['zh-CN', slug, 'using_line_dashes'],
    ['en-US', slug + '/Other', 'using_line_dashes'],
    ['en-US', slug, 'other_sample'],
  ])('leave other sample scopes unchanged: %s %s #%s', async (locale, page, id) => {
    const f = fixture(locale);
    await f.process(page, sample(locale, page, js).replaceAll('demo', id));
    const runner = f.submitted.find(r => r.savePath.includes('/runner-'))!;
    expect((runner.meta.doc as CheerioStatic)('#mdn-play-js').text()).toBe(js);
  });
});
