import {beforeEach, expect, jest, test} from '@jest/globals';
import type {Resource} from 'website-scrap-engine/lib/resource.js';
import {ResourceType} from 'website-scrap-engine/lib/resource.js';
import {defaultDownloadOptions} from 'website-scrap-engine/lib/options.js';

const downloadResource = jest.fn<(res: Resource) => Promise<Resource>>();
jest.unstable_mockModule('website-scrap-engine/lib/life-cycle/index.js', () => ({
  downloadResource,
}));
const {downloadAndFallback} = await import('../../src/mdn/download-and-fallback.js');
const {createResource} = await import('website-scrap-engine/lib/resource.js');
const options = {...defaultDownloadOptions({}), meta: {locale: 'zh-CN'}};
const notFound = Object.assign(new Error('Not found'), {
  name: 'HTTPError', response: {statusCode: 404},
});
function resource(downloadLink: string) {
  const url = 'https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API/' +
    'Tutorial/Basic_animations/canvas_sun.png';
  return {...createResource({type: ResourceType.Binary, depth: 1,
    url, refUrl: url, localRoot: '/unused'}), downloadLink};
}

beforeEach(() => downloadResource.mockReset());

test('localized attachment aliases still fall back to their English source', async () => {
  const url = 'https://developer.mozilla.org/zh-CN/docs/Example/canonical.png';
  const res = resource(url);
  downloadResource.mockRejectedValueOnce(notFound).mockImplementationOnce(async r => r);
  await downloadAndFallback(res, {}, options);
  expect(downloadResource).toHaveBeenCalledTimes(2);
  expect(res.downloadLink).toBe(url.replace('/zh-CN/', '/en-US/'));
});

test('an external shared-asset alias never becomes an invalid English MDN URL', async () => {
  const url = 'https://www.mdnplay.dev/shared-assets/images/examples/rhino.jpg';
  const res = resource(url);
  downloadResource.mockRejectedValue(notFound);
  await expect(downloadAndFallback(res, {}, options)).rejects.toBe(notFound);
  expect(downloadResource).toHaveBeenCalledTimes(1);
  expect(res.downloadLink).toBe(url);
});
