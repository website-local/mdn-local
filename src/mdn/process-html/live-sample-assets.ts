import type {DownloadResource, SubmitResourceFunc} from 'website-scrap-engine/lib/life-cycle/types.js';
import type {PipelineExecutor} from 'website-scrap-engine/lib/life-cycle/pipeline-executor.js';
import {ResourceType} from 'website-scrap-engine/lib/resource.js';
import type {ResourceBody, ResourceEncoding} from 'website-scrap-engine/lib/resource.js';
import {error} from 'website-scrap-engine/lib/logger/logger.js';

interface SampleAsset {
  name: string;
  source?: string;
  embed?: 'image/jpeg';
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
  'Web/API/CanvasRenderingContext2D/getImageData': [{name: 'plumeria.jpg'}],
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

export function liveSampleAssets(pageUrl: string): readonly SampleAsset[] {
  const url = new URL(pageUrl);
  if (url.hostname !== 'developer.mozilla.org') return [];
  const match = /^\/[^/]+\/docs\/(.+?)\/?$/.exec(url.pathname);
  return match ? assets[match[1]] || [] : [];
}

export async function submitLiveSampleAssets(
  res: DownloadResource, submit: SubmitResourceFunc, pipeline: PipelineExecutor
): Promise<EmbeddedSampleAssets> {
  const embedded = new Map<string, string | null>();
  const page = new URL(res.redirectedUrl || res.url);
  const pageAssets = liveSampleAssets(page.href);
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
        if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 ||
          bytes[2] !== 0xff) throw new Error('Invalid JPEG body');
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
  for (const asset of liveSampleAssets(pageUrl)) {
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
  return js;
}
