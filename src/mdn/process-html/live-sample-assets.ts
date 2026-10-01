import type {DownloadResource, SubmitResourceFunc} from 'website-scrap-engine/lib/life-cycle/types.js';
import type {PipelineExecutor} from 'website-scrap-engine/lib/life-cycle/pipeline-executor.js';
import {ResourceType} from 'website-scrap-engine/lib/resource.js';

interface SampleAsset {
  name: string;
  source?: string;
}

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
): Promise<void> {
  const page = new URL(res.redirectedUrl || res.url);
  const pageAssets = liveSampleAssets(page.href);
  page.hash = '';
  page.search = '';
  page.pathname = page.pathname.replace(/\/?$/, '/');
  for (const asset of pageAssets) {
    const source = new URL(asset.source || asset.name, page).href;
    const resource = await pipeline.createAndProcessResource(
      source, ResourceType.Binary, res.depth + 1, null, res);
    if (!resource || resource.shouldBeDiscardedFromDownload) continue;
    const aliasUrl = new URL(asset.name, page).href;
    if (resource.url === aliasUrl) {
      submit(resource);
    } else {
      // Keep the filename used by the unmodified JavaScript. Downloads still
      // use the canonical URL and normal localized fallback handling.
      const alias = await pipeline.createResource(
        ResourceType.Binary, resource.depth, aliasUrl, page.href, res.localRoot);
      alias.downloadLink = resource.downloadLink;
      submit(alias);
    }
  }
}

export function localizeSampleAssetUrls(js: string, pageUrl: string): string {
  for (const asset of liveSampleAssets(pageUrl)) {
    if (asset.source?.startsWith('/') || asset.source?.startsWith('https://')) {
      // Exact known URLs only, in executable runner code. Displayed examples
      // remain unchanged; there is no general JavaScript URL extraction.
      for (const quote of ['"', '\'', '`']) {
        js = js.split(quote + asset.source + quote).join(quote + asset.name + quote);
      }
    }
  }
  return js;
}
