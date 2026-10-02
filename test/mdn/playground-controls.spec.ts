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
    setTimeout(callback: () => void) { callback(); },
  });
}

const TabWrapper = component('ix-tab', 'MDNIXTabWrapper');
const Editor = component('play-editor', 'MDNPlayEditor');
const Example = component('interactive-example', 'InteractiveExample');

describe('offline playground controls', () => {
  test.each([2, 3])('moves one tab per keypress with %i tabs', count => {
    const tabs = Array.from({length: count}, () => ({
      isActive: false,
      setActive() { this.isActive = true; },
      unsetActive() { this.isActive = false; },
      focus() {},
    }));
    const tablist = new EventTarget();
    const wrapper = Object.assign(Object.create(TabWrapper.prototype), {
      shadowRoot: {innerHTML: '', getElementById: () => tablist},
      querySelector: () => tabs[0],
      querySelectorAll: () => tabs,
    });
    wrapper.connectedCallback();
    const press = (key: string, selected: number) => {
      const event = Object.assign(new Event('keydown', {cancelable: true}), {key});
      tablist.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      expect(tabs.map(tab => tab.isActive)).toEqual(tabs.map((_, i) => i === selected));
    };
    press('ArrowRight', 1);
    press('ArrowLeft', 0);
    press('ArrowUp', count - 1);
    press('ArrowDown', 0);
    press('End', count - 1);
    press('Home', 0);
  });

  test.each([
    ['_renderConsole', ['execute', 'reset']],
    ['_renderTabbed', ['reset']],
  ] as const)('%s emits native non-submit buttons with the existing action IDs', (method, ids) => {
    const example = Object.assign(Object.create(Example.prototype), {
      name: 'Example', _languages: ['js'],
    });
    const $ = load(example[method]());
    expect($('mdn-button')).toHaveLength(0);
    expect($('button').map((_, el) => $(el).attr('id')).get()).toEqual(ids);
    expect($('button[type="button"]')).toHaveLength(ids.length);
    expect($('#reset').text().trim()).toBe('Reset');
  });

  test.each([false, true])('preserves editor classes when minimal is %s', minimal => {
    // Skip loading CodeMirror: this regression concerns the rendered container.
    Editor._ready = Promise.resolve();
    const editor = {
      minimal,
      shadowRoot: {innerHTML: ''},
      attachShadow() {},
      firstUpdated() {},
    };
    Editor.prototype.render.call(editor);
    const $ = load(editor.shadowRoot.innerHTML);
    expect($('.editor').attr('class')).toBe(minimal ? 'editor minimal' : 'editor');
    expect($('.editor').hasClass('minimal')).toBe(minimal);
    expect($('.editor').attr('minimal')).toBeUndefined();
  });
});
