import type {DownloadResource, SubmitResourceFunc} from 'website-scrap-engine/lib/life-cycle/types.js';
import type {PipelineExecutor} from 'website-scrap-engine/lib/life-cycle/pipeline-executor.js';
import {ResourceType} from 'website-scrap-engine/lib/resource.js';
import type {ResourceBody, ResourceEncoding} from 'website-scrap-engine/lib/resource.js';
import {error} from 'website-scrap-engine/lib/logger/logger.js';
import {toString} from 'website-scrap-engine/lib/util.js';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options.js';

interface SampleAsset {
  name: string;
  source?: string;
  embed?: 'image/jpeg' | 'image/png';
}

export type EmbeddedSampleAssets = ReadonlyMap<string, string | null>;

// Only pages with missing runtime assets in the 2026-10-01 archives.
// Sibling files reviewed at mdn/content@bacd00c353f643d8f5be0ce769015b1a66b4251a
// and mdn/translated-content@b0ea36c2198d9e4dc453266a2550e7685748b80b.
// Rari copies these files without inspecting JavaScript. The extra aliases
// preserve old translated filenames and shared-asset references in runners.
const pattern: SampleAsset[] = [
  {name: 'canvas_create_pattern.png'},
  {name: 'canvas_createpattern.png', source: 'canvas_create_pattern.png'},
];
const assets: Readonly<Record<string, readonly SampleAsset[]>> = {
  'Web/API/CanvasPattern/setTransform': pattern,
  'Web/API/CanvasRenderingContext2D/createPattern': pattern,
  'Web/API/CanvasRenderingContext2D/imageSmoothingQuality': pattern,
  'Web/API/Canvas_API/Tutorial/Applying_styles_and_colors': pattern,
  'Web/API/CanvasRenderingContext2D/getImageData': [{name: 'plumeria.jpg', embed: 'image/jpeg'}],
  'Web/API/CanvasRenderingContext2D/imageSmoothingEnabled': [{
    name: 'big-star.png', source: '/shared-assets/images/examples/big-star.png',
  }],
  'Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas': [{
    name: 'rhino.jpg', source: '/shared-assets/images/examples/rhino.jpg',
    embed: 'image/jpeg',
  }],
  'Web/API/Canvas_API/Tutorial/Basic_animations': [
    'canvas_earth.png', 'canvas_moon.png', 'canvas_sun.png',
    'capitan_meadows_yosemite_national_park.jpg',
  ].map(name => ({name})),
  'Web/API/Canvas_API/Tutorial/Using_images': [
    ...[
      'backdrop.png', 'bg_gallery.png', 'canvas_drawimage.jpg',
      'canvas_picture_frame.png', 'gallery_1.jpg', 'gallery_2.jpg',
      'gallery_3.jpg', 'gallery_4.jpg', 'gallery_5.jpg', 'gallery_6.jpg',
      'gallery_7.jpg', 'gallery_8.jpg',
    ].map(name => ({name})),
    {name: 'rhino.jpg', source: 'https://mdn.github.io/shared-assets/images/examples/rhino.jpg'},
  ],
};

// Exact shared assets used by the gallery and breakout examples reviewed in
// the 2026-10-02 archives. No JavaScript dependency discovery is needed.
const sharedBase = 'https://mdn.github.io/shared-assets/images/examples/';
const galleryBase = sharedBase + 'learn/gallery/';
const breakoutDirectory = '2D_breakout_game_Phaser';
const galleryAssets: SampleAsset[] = [1, 2, 3, 4, 5].map(i => ({
  name: `pic${i}.jpg`, source: `${galleryBase}pic${i}.jpg`,
}));
const breakoutAssets: SampleAsset[] = ['ball', 'paddle', 'brick', 'button', 'wobble']
  .map(name => ({
    name: `${breakoutDirectory}/${name}.png`,
    source: `${sharedBase}${breakoutDirectory}/${name}.png`,
  }));
const breakoutChapters = new Set([
  'Move_the_ball', 'Bounce_off_the_walls', 'Physics', 'Game_over',
  'Player_paddle_and_controls', 'Build_the_brick_field',
  'Track_the_score_and_win', 'Extra_lives', 'Animations_and_tweens',
  'Buttons', 'Randomizing_gameplay',
]);
const blogPath = 'blog/image-formats-pixels-graphics';
const blogAssets: SampleAsset[] = [
  {name: 'squirrel-grayscale.jpg', embed: 'image/jpeg'},
  {name: 'squirrel.png', embed: 'image/png'},
];
const galleryScript = '/dom-examples/view-transitions/spa-gallery-transition-types/main.js';

function isGalleryScript(url: URL): boolean {
  return url.hostname === 'mdn.github.io' && url.pathname === galleryScript ||
    url.hostname === 'developer.mozilla.org' && url.pathname === '/mdn-github-io' + galleryScript;
}

export function liveSampleAssets(pageUrl: string): readonly SampleAsset[] {
  const url = new URL(pageUrl);
  if (isGalleryScript(url)) return galleryAssets;
  if (url.hostname !== 'developer.mozilla.org') return [];
  if (url.pathname.replace(/^\/[^/]+\//, '').replace(/\/$/, '') === blogPath) return blogAssets;
  const match = /^\/[^/]+\/docs\/(.+?)\/?$/.exec(url.pathname);
  if (!match) return [];
  const slug = match[1];
  if (slug === 'Learn_web_development/Core/Scripting/Image_gallery') return galleryAssets;
  const breakout = /^(?:conflicting\/)?Games\/Tutorials\/2D_breakout_game_(Phaser|pure_JavaScript)\/([^/]+)$/.exec(slug);
  if (breakout && breakoutChapters.has(breakout[2])) return breakoutAssets;
  return assets[slug] || [];
}

export async function submitLiveSampleAssets(
  res: DownloadResource, submit: SubmitResourceFunc, pipeline: PipelineExecutor
): Promise<EmbeddedSampleAssets> {
  const embedded = new Map<string, string | null>();
  let page = new URL(res.redirectedUrl || res.url);
  const pageAssets = liveSampleAssets(page.href);
  if (isGalleryScript(page)) page = new URL('.', page);
  page.hash = '';
  page.search = '';
  page.pathname = page.pathname.replace(/\/?$/, '/');
  for (const asset of pageAssets) {
    if (asset.embed) embedded.set(asset.name, null);
    const source = new URL(asset.source || asset.name, page).href;
    const resource = await pipeline.createAndProcessResource(
      source, ResourceType.Binary, res.depth + 1, null, res);
    if (!resource || resource.shouldBeDiscardedFromDownload) continue;
    let body: ResourceBody | undefined;
    let encoding: ResourceEncoding | undefined;
    if (asset.embed) {
      try {
        const downloaded = await pipeline.download(resource);
        body = downloaded?.body;
        encoding = downloaded?.encoding;
        if (!body) throw new Error('Missing image body');
        const bytes = typeof body === 'string'
          ? Buffer.from(body, encoding || 'utf8')
          : ArrayBuffer.isView(body)
            ? Buffer.from(body.buffer, body.byteOffset, body.byteLength)
            : Buffer.from(body);
        // Reject empty/non-image responses rather than embedding an error page.
        const signature = asset.embed === 'image/png'
          ? [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] : [0xff, 0xd8, 0xff];
        if (bytes.length <= signature.length ||
          !signature.every((value, i) => bytes[i] === value)) throw new Error('Invalid image body');
        embedded.set(asset.name, `data:${asset.embed};base64,${bytes.toString('base64')}`);
      } catch (err) {
        error.warn('Cannot embed live-sample image', source, err);
        continue;
      }
    }
    const aliasUrl = new URL(asset.name, page).href;
    if (resource.url === aliasUrl) {
      if (body) resource.body = body;
      if (encoding !== undefined) resource.encoding = encoding;
      submit(resource);
    } else {
      // Keep the filename used by the unmodified JavaScript. Downloads still
      // use the canonical URL and normal localized fallback handling.
      const alias = await pipeline.createResource(
        ResourceType.Binary, resource.depth, aliasUrl, page.href, res.localRoot);
      alias.downloadLink = resource.downloadLink;
      if (body) alias.body = body;
      if (encoding !== undefined) alias.encoding = encoding;
      submit(alias);
    }
  }
  return embedded;
}

export function localizeSampleAssetUrls(
  js: string, pageUrl: string, embedded: EmbeddedSampleAssets
): string | undefined {
  const pageAssets = liveSampleAssets(pageUrl);
  for (const asset of pageAssets) {
    if (asset.embed) {
      for (const source of new Set([asset.name, asset.source])) {
        if (!source) continue;
        for (const quote of ['"', '\'', '`']) {
          const literal = quote + source + quote;
          if (!js.includes(literal)) continue;
          const data = embedded.get(asset.name);
          if (!data) return;
          js = js.split(literal).join(quote + data + quote);
        }
      }
    } else if (asset.source?.startsWith('/') || asset.source?.startsWith('https://')) {
      // Exact known URLs only, in executable runner code. Displayed examples
      // remain unchanged; there is no general JavaScript URL extraction.
      for (const quote of ['"', '\'', '`']) {
        js = js.split(quote + asset.source + quote).join(quote + asset.name + quote);
      }
    }
  }
  if (pageAssets === galleryAssets) {
    js = replaceLiteral(js, galleryBase, './');
  } else if (pageAssets === breakoutAssets) {
    js = replaceLiteral(js, sharedBase + breakoutDirectory, './' + breakoutDirectory);
    js = replaceLiteral(js, sharedBase + breakoutDirectory + '/', './' + breakoutDirectory + '/');
    js = replaceLiteral(js, sharedBase, './');
    // Phaser 3's default XHR image loader rejects file: URLs. Preserve other
    // game/loader options and change only these reviewed executable runners.
    js = js.split('new Phaser.Game(config)').join(
      'new Phaser.Game({...config, loader: {...config.loader, imageLoadType: "HTMLImageElement"}})');
  }
  return js;
}

function replaceLiteral(js: string, source: string, target: string): string {
  for (const quote of ['"', '\'', '`']) {
    js = js.split(quote + source + quote).join(quote + target + quote);
  }
  return js;
}

export async function processLiveSampleScript(
  res: DownloadResource, submit: SubmitResourceFunc,
  options: StaticDownloadOptions, pipeline: PipelineExecutor
): Promise<DownloadResource> {
  if (res.type !== ResourceType.Binary || !isGalleryScript(new URL(res.redirectedUrl || res.url))) {
    return res;
  }
  await submitLiveSampleAssets(res, submit, pipeline);
  res.body = localizeSampleAssetUrls(toString(res.body, res.encoding ||
    options.encoding[ResourceType.Binary] || 'utf8'), res.redirectedUrl || res.url, new Map())!;
  return res;
}
