import {
  processPathWithMultiLocale
} from '../../../src/mdn/process-url/process-path-with-multi-locale.js';
import URI = require('urijs');

const testCases = [
  [
    'https://developer.mozilla.org/zh-CN/zh-cn/docs/E4X',
    'https://developer.mozilla.org/zh-CN/docs/E4X'
  ],
  [
    'https://developer.mozilla.org/zh-CN/zh-cn/docs/JavaScript/Reference/Global_Objects/Set',
    'https://developer.mozilla.org/zh-CN/docs/JavaScript/Reference/Global_Objects/Set'
  ],
  [
    'https://developer.mozilla.org/zh-CN/zh-cn/docs/JavaScript/Reference/Global_Objects/ParallelArray',
    'https://developer.mozilla.org/zh-CN/docs/JavaScript/Reference/Global_Objects/ParallelArray'

  ],
  [
    'https://developer.mozilla.org/zh-CN/docs/zh-CN/zh-CN/docs/Games/Visual-js_game_engine',
    'https://developer.mozilla.org/zh-CN/docs/Games/Visual-js_game_engine'
  ],
  [
    'https://developer.mozilla.org/zh-CN/docs/cn/cn/cn/XTech_2005_Presentations?page=1',
    'https://developer.mozilla.org/zh-CN/docs/XTech_2005_Presentations?page=1'
  ]
];

describe('process-path-with-multi-locale', function () {
  const process = (url: string) => {
    const u = URI(url);
    const pathArr = u.path().split('/');
    if (processPathWithMultiLocale(pathArr, 'zh-CN')) {
      url = u.path(pathArr.join('/')).toString();
    }
    return url;
  };
  // https://github.com/myfreeer/mdn-local/issues/4
  test('process-path-with-multi-locale', () => {
    for (const testCase of testCases) {
      expect(process(testCase[0])).toBe(testCase[1]);
    }
  });

  test('not touching normal links', () => {
    const normalLinks = [
      'https://developer.mozilla.org/',
      'https://developer.mozilla.org/zh-CN/',
      'https://developer.mozilla.org/zh-CN/docs',
      'https://developer.mozilla.org/static/img/favicon32.png'
    ];
    for (const normalLink of normalLinks) {
      expect(process(normalLink)).toBe(normalLink);
    }
    expect(processPathWithMultiLocale([], 'zh-CN')).toBeFalsy();
  });
});
