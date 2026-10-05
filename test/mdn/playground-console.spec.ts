import {describe, expect, test} from '@jest/globals';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {load} from 'cheerio';

const injected = readFileSync(new URL('../../src/mdn/inject/inject.js', import.meta.url), 'utf8');

function component(region: string, name: string, globals = {}) {
  const source = injected.split(`/// region ${region}`)[1].split(`/// endregion ${region}`)[0];
  return runInNewContext(`${source}; ${name};`, {
    HTMLElement: class {},
    customElements: {define() {}},
    CustomEvent: class {
      constructor(public type: string, public options: unknown) {}
    },
    ...globals,
  });
}

const Runner = component('play-runner', 'MDNPlayRunner');

// Exercise the real component against Cheerio nodes with a controllable frame
// scheduler. Node identities and DOM/layout operation counts need no browser.
function consoleFixture() {
  const $ = load('');
  const frames = new Map<number, () => void>();
  let frameId = 0;
  const operations = {htmlWrites: 0, createdElements: 0, layoutReads: 0, scrolls: 0};

  class Node {
    constructor(public element: ReturnType<typeof $>, public fragment = false) {}
    set innerHTML(html: string) {
      operations.htmlWrites++;
      this.element.html(html);
    }
    set textContent(text: string) { this.element.text(text); }
    get childElementCount() { return this.element.children().length; }
    get firstElementChild(): Node { return new Node(this.element.children().first()); }
    querySelector(selector: string) { return new Node(this.element.find(selector).first()); }
    appendChild(child: Node) {
      this.element.append(child.fragment ? child.element.contents() : child.element);
    }
    replaceChildren() { this.element.empty(); }
    remove() { this.element.remove(); }
  }

  class Host {
    isConnected = false;
    shadowRoot?: Node;
    attachShadow() { this.shadowRoot = new Node($('<div>')); }
    get scrollHeight() { operations.layoutReads++; return 100; }
    scrollTo() { operations.scrolls++; }
  }
  const Console = component('play-console', 'MDNPlayConsole', {
    HTMLElement: Host,
    document: {
      createElement(tag: string) {
        operations.createdElements++;
        return new Node($(`<${tag}>`));
      },
      createDocumentFragment: () => new Node($('<div>'), true),
    },
    window: {
      requestAnimationFrame(callback: () => void) {
        const id = frameId++;
        frames.set(id, callback);
        return id;
      },
      cancelAnimationFrame(id: number) { frames.delete(id); },
    },
  });
  const host = new Console();
  const root = (host.shadowRoot as Node).element;
  function connect() { host.isConnected = true; host.connectedCallback(); }
  connect();
  return {
    host, root, frames, operations, connect,
    disconnect() { host.isConnected = false; host.disconnectedCallback(); },
    flush() {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach(callback => callback());
    },
    messages() { return root.find('li code').map((_, el) => $(el).text()).get(); },
  };
}

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
    const console = consoleFixture();
    const messages = ['"<b>literal</b> & <x>value</x>"', '&lt;tag&gt;', '</code><img src="missing">'];
    messages.forEach(message => console.host.appendMessage(message));
    console.flush();
    expect(console.messages()).toEqual(messages);
    expect(console.root.find('li code').children()).toHaveLength(0);
    expect(console.root.find('img')).toHaveLength(0);
    expect(console.root.find('ul').attr('aria-live')).toBe('polite');
    console.host.vconsole.clear();
    console.flush();
    expect(console.messages()).toEqual([]);
  });

  test('batches logs and preserves existing DOM without re-rendering history', () => {
    const console = consoleFixture();
    console.host.vconsole.log('first');
    console.flush();
    const first = console.root.find('li')[0];
    const style = console.root.find('style')[0];
    for (let i = 0; i < 100; i++) console.host.vconsole.log(i);
    expect(console.frames.size).toBe(1);
    expect(console.operations.layoutReads).toBe(1);
    expect(console.operations.createdElements).toBe(2);
    console.flush();
    expect(console.messages()).toEqual(['"first"', ...Array.from({length: 100}, (_, i) => String(i))]);
    expect(console.root.find('li')[0]).toBe(first);
    expect(console.root.find('style')[0]).toBe(style);
    expect(console.operations).toEqual({htmlWrites: 1, createdElements: 202, layoutReads: 2, scrolls: 2});
  });

  test('keeps only the latest 1,000 messages in pending and displayed output', () => {
    const console = consoleFixture();
    for (let i = 0; i < 2500; i++) console.host.vconsole.log(i);
    expect(console.host._pendingMessages.length).toBeLessThanOrEqual(1000);
    expect(console.frames.size).toBe(1);
    expect(console.operations.createdElements).toBe(0);
    console.flush();
    expect(console.messages()).toEqual(Array.from({length: 1000}, (_, i) => String(1500 + i)));
    expect(console.host._pendingMessages).toHaveLength(0);
    expect(console.operations.createdElements).toBe(2000);
    const retained = console.root.find('li')[1];
    console.host.vconsole.log(2500);
    console.flush();
    expect(console.messages()).toEqual(Array.from({length: 1000}, (_, i) => String(1501 + i)));
    expect(console.root.find('li')[0]).toBe(retained);
  });

  test('clear discards rendered and queued output while preserving later logs', () => {
    const console = consoleFixture();
    console.host.vconsole.log('rendered');
    console.flush();
    console.host.vconsole.log('queued');
    console.host.onConsole({detail: {prop: 'clear', args: []}});
    console.host.vconsole.log('after clear');
    console.flush();
    expect(console.messages()).toEqual(['"after clear"']);
    console.host.vconsole.log('discarded');
    console.host.vconsole.clear();
    console.host.vconsole.clear();
    console.flush();
    expect(console.messages()).toEqual([]);
  });

  test('cancels detached updates and resumes bounded pending output on reconnect', () => {
    const console = consoleFixture();
    console.host.vconsole.log('first');
    console.disconnect();
    expect(console.frames.size).toBe(0);
    console.host.vconsole.log('detached');
    console.flush();
    expect(console.operations.layoutReads).toBe(0);
    console.connect();
    expect(console.frames.size).toBe(1);
    console.flush();
    expect(console.messages()).toEqual(['"first"', '"detached"']);
    console.disconnect();
    console.connect();
    expect(console.frames.size).toBe(0);
  });

  test('preserves Fred console formatting, aliases and unsupported-method warnings', () => {
    const console = consoleFixture();
    console.host.onConsole({detail: {prop: 'log', args: ['%s: %i', 'count', 3.9]}});
    console.host.vconsole.debug([1, 'two']);
    console.host.vconsole.info({ok: true});
    console.host.vconsole.warn(-0, BigInt(2), null);
    console.host.vconsole.error('<error>');
    console.host.onConsole({detail: {prop: 'table', args: []}});
    console.flush();
    expect(console.messages()).toEqual([
      '"count: 3"', 'Array [1, "two"]', 'Object { ok: true }',
      '-0 2n null', '"<error>"',
      '"[Playground] Unsupported console message (see browser console)"',
    ]);
  });
});
