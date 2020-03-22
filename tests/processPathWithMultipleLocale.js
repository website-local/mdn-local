const {processPathWithMultipleLocale} = require('../mdn-process-url');
const URI = require('urijs');
const assertEquals = (expected, actual, msg) => {
  if (expected !== actual) {
    if (msg) console.error(msg, expected, actual);
    else console.error('assertEquals Fails', ' Expected: ', expected, ' Actual: ', actual);
    return false;
  }
  return true;
};

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

const process = url => {
  const u = new URI(url);
  const pathArr = u.path().split('/');
  if (processPathWithMultipleLocale(pathArr, 'zh-CN')) {
    url = u.path(pathArr.join('/')).toString();
  }
  return url;
};

testCases.forEach(testCase => assertEquals(testCase[1], process(testCase[0])));