const path = require('path');

/** @type {Partial<SearchConfig>} */
const defaultConfig = {
  port: 3000,
  logPath: process.cwd(),
  maxSearchStringLength: 63,
  pageSize: 10,
  workersForBuildingIndex: 3,
  text: {
    beforeTitle: '搜索结果：“',
    afterTitle: '” | MDN',
    results: '搜索结果：',
    search: '搜索 MDN',
    previousPage: '上一页',
    nextPage: '下一页',
    openSearch: '打开搜索',
    closeSearch: '关闭搜索',
    meta: [
      '在 ',
      ' 版本中找到 ',
      ' 篇关于“',
      '”的文档。 已显示结果 ',
      ' 至 ',
      '。'
    ]
  },
  esIndexSetting: {
    max_ngram_diff: 18,
    analysis: {
      filter: {
        kuma_word_delimiter: {
          type: 'word_delimiter',
          preserve_original: true,  // hi-fi -> hifi, hi-fi
          catenate_words: true,  // hi-fi -> hifi
          catenate_numbers: true,  // 90-210 -> 90210
        }
      },
      analyzer: {
        'default': {'tokenizer': 'standard', 'filter': ['elision']},
        kuma_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: [
            'elision',
            'kuma_word_delimiter',
            'lowercase',
            'stop',
            'snowball',
          ]
        },
        ngram_analyzer: {
          type: 'custom',
          tokenizer: 'ngram_tokenizer',
          filter: [
            'elision',
            'lowercase',
            'stop',
            'snowball',
          ]
        }
      },
      tokenizer: {
        ngram_tokenizer: {
          type: 'ngram',
          min_gram: 2,
          max_gram: 16,
          token_chars: [
            'letter',
            'digit'
          ]
        }
      }
    }
  },
  esIndexMapping: {
    properties: {
      title: {
        type: 'text',
        analyzer: 'ngram_analyzer',
        search_analyzer: 'kuma_analyzer'
      },
      summary: {
        type: 'text',
        analyzer: 'ngram_analyzer',
        search_analyzer: 'kuma_analyzer'
      },
      breadcrumb: {
        type: 'text',
        analyzer: 'ngram_analyzer',
        search_analyzer: 'kuma_analyzer'
      },
      content: {
        type: 'text',
        analyzer: 'kuma_analyzer',
        search_analyzer: 'kuma_analyzer'
      }
    }
  }
};

const required = (config, field) => {
  if (!config[field]) {
    throw new TypeError(field + ' is required');
  }
};

/**
 * @param {Partial<SearchConfig>} config
 * @return SearchConfig
 */
const resolveConfig = (config) => {
  if (!config) throw new TypeError('config is required');
  required(config, 'rootDir');
  required(config, 'esIndex');
  required(config, 'elasticsearch');
  required(config, 'locale');
  return Object.assign({}, defaultConfig, config);
};

module.exports = resolveConfig;

module.exports.resolveArgv = () => {
  const {argv} = require('yargs')
    .alias('c', 'config')
    .demand('config', true);
  /** @type {string | string[]} */
  let config = argv.config;
  if (Array.isArray(config)) {
    // probably try every possibly config
    config = config[0];
  }

  return resolveConfig(require(
    path.isAbsolute(config) ? config : path.resolve(process.cwd(), config)));
};
