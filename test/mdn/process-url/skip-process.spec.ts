import {skipProcess} from '../../../src/mdn/process-url/skip-process';

const exceptSkipped = (url: string) =>
  expect(skipProcess(url, null, null)).toBe(undefined);

const exceptNotSkipped = (url: string) =>
  expect(skipProcess(url, null, null)).toBe(url);

describe('skip-process', function () {
  test('keep url starting with /', () => {
    exceptNotSkipped('/test');
    exceptNotSkipped('/docs');
    exceptNotSkipped('/zh-CN/docs/Web');
  });

  test('skip hash link', () => {
    exceptSkipped('#a/sdfsd/sdf/sfds/');
    exceptNotSkipped('aaa#bbb');
    exceptSkipped('#######');
  });

  // note that this is not likely needed since this should already be skipped
  // by website-scrap-engine/lib/life-cycle/skip-links
  test('skip url with unprocessable protocol', () => {
    exceptSkipped('about:blank');
    exceptSkipped('data:text/plain,qew');
    exceptSkipped('javascript:void(0);');
    exceptSkipped('chrome://flags');
    exceptSkipped('news:news.mozilla.org/netscape.public.mozilla.dom');
    exceptNotSkipped('http://developer.mozilla.org/zh-CN/docs/');
  });

  test('skip url with bad protocol', () => {
    exceptSkipped('https:\\\\google.com');
    exceptSkipped('http:\\\\google.com');
  });

  test('skip non-mdn url', () => {
    exceptNotSkipped('https://developer.mozilla.org/zh-CN/docs/Web/JavaScript');
    exceptNotSkipped('http://wiki.developer.mozilla.org/zh-CN/docs/Web/JavaScript');
    exceptNotSkipped('https://interactive-examples.mdn.mozilla.net');
    exceptNotSkipped('https://unpkg.com/imsc@1.1.0-beta.2/build/umd/imsc.all.min.js');
    exceptNotSkipped('https://mdn.github.io/webaudio-examples/panner-node/');
    exceptSkipped('https://couchdb.apache.org/');
    exceptSkipped('https://nodejs.org/');
    exceptSkipped('https://www.ecma-international.org/');
    exceptSkipped('https://kangax.github.io/compat-table/es5/');
  });

  test('skip presentations and large files', () => {
    exceptSkipped('https://developer.mozilla.org/presentations/xtech2005/svg-canvas/SVGDemo.xml');
    exceptSkipped('https://developer.mozilla.org/files/5237/CommonControls_20130305.psd');
    exceptSkipped('https://mdn.mozillademos.org/files/5239/IconsMedia_20130305.psd');
    exceptSkipped('https://developer.mozilla.org/files/5241/IconsStatusBar_20130122.psd');
    exceptSkipped('https://mdn.mozillademos.org/files/5247/IconsPrimaryAction_20130501.psd');
  });

  // https://github.com/myfreeer/mdn-local/issues/34
  // https://github.com/mdn/yari/pull/39
  // https://github.com/website-local/mdn-local/issues/211
  test('keep remote favicon #34', () => {
    expect(skipProcess('http://www.mozilla.org/favicon.ico', null, null))
      .toBe('https://developer.mozilla.org/favicon.ico');
  });

  test('skip incorrectly-parsed url', () => {
    // https://developer.mozilla.org/zh-CN/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/React_getting_started
    exceptSkipped('localhost:3000');
  });
});
