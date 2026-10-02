import {describe, expect, test} from '@jest/globals';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {load} from 'cheerio';

const injected = readFileSync(new URL('../../src/mdn/inject/inject.js', import.meta.url), 'utf8');

function component(region: string, name: string) {
  const source = injected.split(`/// region ${region}`)[1].split(`/// endregion ${region}`)[0];
  return runInNewContext(`${source}; ${name};`, {
    HTMLElement: class {},
    customElements: {define() {}},
    CustomEvent: class {
      constructor(public type: string, public options: unknown) {}
    },
  });
}

const Runner = component('play-runner', 'MDNPlayRunner');
const PlayConsole = component('play-console', 'MDNPlayConsole');

function runner() {
  const events: unknown[] = [];
  let ready = false;
  const source = {};
  const host = {
    _iframe: {contentWindow: source},
    dispatchEvent(event: unknown) { events.push(event); },
    _resolveReady() { ready = true; },
  };
  return {
    events, source, get ready() { return ready; },
    message(data: unknown, sender: unknown = source) {
      Runner.prototype._onMessage.call(host, {data, source: sender});
    },
  };
}

describe('offline playground messages', () => {
  test('only its own iframe can forward console output or resolve readiness', () => {
    const first = runner();
    const second = runner();
    const consoleMessage = {typ: 'console', prop: 'log', args: ['first only']};
    first.message(consoleMessage);
    second.message(consoleMessage, first.source);
    second.message({typ: 'ready'}, first.source);
    expect(first.events).toEqual([{
      type: 'console', options: {
        bubbles: true, composed: true, detail: {prop: 'log', args: ['first only']},
      },
    }]);
    expect(second.events).toEqual([]);
    expect(second.ready).toBe(false);
    second.message({typ: 'ready'});
    expect(second.ready).toBe(true);
    expect(first.ready).toBe(false);
  });

  test.each([null, undefined, 'ready', 1, {},
    {typ: 'console', prop: 'log', args: 'invalid'},
    {typ: 'console', args: []},
  ])('ignores malformed message %j', data => {
    const r = runner();
    expect(() => r.message(data)).not.toThrow();
    expect(r.events).toEqual([]);
    expect(r.ready).toBe(false);
  });

  test('ignores messages without an owning frame', () => {
    const r = runner();
    r.message({typ: 'ready'}, null);
    expect(r.ready).toBe(false);
  });

  test('renders console strings as literal text and preserves separate messages', () => {
    const messages = ['"<b>literal</b> & <x>value</x>"', '&lt;tag&gt;', '</code><img src="missing">'];
    const host = {shadowRoot: {innerHTML: ''}, _messages: messages};
    PlayConsole.prototype.render.call(host);
    const $ = load(host.shadowRoot.innerHTML);
    expect($('li code').map((_, el) => $(el).text()).get()).toEqual(messages);
    expect($('li code').children()).toHaveLength(0);
    expect($('img')).toHaveLength(0);
    host._messages = [];
    PlayConsole.prototype.render.call(host);
    expect(load(host.shadowRoot.innerHTML)('li')).toHaveLength(0);
  });
});
