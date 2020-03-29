const es = require('@elastic/elasticsearch');
const Koa = require('koa');
const koaStatic = require('koa-static');
const initTemplate = require('./init-template');
const renderPage = require('./render-page');
const {Readable} = require('stream');

/**
 * @param {SearchConfig} config
 * @param {ElasticSearchClient} client
 * @param {MdnSearchTemplate} template
 * @return {Application.Middleware}
 */
const searchServer = (config, client, template) => async (ctx, next) => {
  if (ctx.path !== '/search' && ctx.path !== `/${config.locale}/search`) {
    if (ctx.path === '/static/build/styles/inject.css') {
      ctx.body = template.injectCss;
      ctx.set('Cache-Control', 'max-age=43200');
      ctx.type = 'css';
      return;
    }
    return await next();
  }
  if (ctx.path === '/search') {
    ctx.redirect(`/${config.locale}/search${ctx.search}`);
    return;
  }
  let {page = 1, q = ''} = ctx.query;
  if (typeof page === 'string') {
    page |= 0;
    if (!page || page < 1) {
      page = 1;
    }
  }
  const stream = new Readable({encoding: 'utf8'});
  ctx.body = stream;
  ctx.type = 'html';
  let from = (page - 1) * config.pageSize || 0;

  /** @type ElasticSearchBody */
  let body = {
    _source: {
      excludes: ['content', 'summary', 'breadcrumb']
    },
    highlight: {
      fields: {
        content: {}
      }
    },
    query: {
      simple_query_string: {
        query: q,
        fields: ['title^5', 'breadcrumb', 'summary', 'content'],
      }
    }
  };
  const result = await client.search({
    index: config.esIndex,
    size: config.pageSize,
    from,
    body
  }, {
    ignore: [404],
    maxRetries: 3
  });
  renderPage(config, template, stream, q, page, from, result);
  // indicates end of the stream
  stream.push(null);
};

/**
 * @param {SearchConfig} config
 * @return {Promise<Application<Application.DefaultState, Application.DefaultContext>>}
 */
module.exports = (config) => {
  const app = new Koa();
  const client = new es.Client(config.elasticsearch);

  return initTemplate(config).then(t => {
    app.use(searchServer(config, client, t));
    app.use(koaStatic(config.rootDir, {
      maxAge: 43200000,
      index: config.locale + '.html'
    }));
    app.listen(config.port, () =>
      console.log('server started on port', config.port));
    return app;
  });
};

module.exports.searchServer = searchServer;
