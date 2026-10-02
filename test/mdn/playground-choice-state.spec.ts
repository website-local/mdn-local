import {describe, expect, test} from '@jest/globals';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const injected = readFileSync(new URL('../../src/mdn/inject/inject.js', import.meta.url), 'utf8');
class ChoiceEditor {
  constructor(public value: string, public dataset: {index: string}) {}
}

function component(region: string, name: string) {
  const source = injected.split(`/// region ${region}`)[1].split(`/// endregion ${region}`)[0];
  return runInNewContext(`${source}; ${name};`, {
    HTMLElement: class {},
    customElements: {define() {}},
    MDNPlayEditor: ChoiceEditor,
    document: {createElement: () => ({style: {cssText: ''}})},
    renderHtml: JSON.stringify,
  });
}

const Runner = component('play-runner', 'MDNPlayRunner');
const Example = component('interactive-example', 'InteractiveExample');

function runner(defaults = 'ix-choice') {
  const messages: unknown[] = [];
  const source = {postMessage(message: unknown) { messages.push(message); }};
  const host = Object.assign(Object.create(Runner.prototype), {
    _iframe: {contentWindow: source, srcdoc: ''},
    defaults, theme: {value: 'light'},
    _code: {html: '<div id="example-element"></div>'},
    ready: Promise.resolve(),
    _resolveReady() {},
  });
  return {host, source, messages};
}

function example() {
  const choices = ['filter: blur(5px);', 'filter: opacity(0.25);'];
  const editors = choices.map((value, i) => new ChoiceEditor(value, {index: String(i)}));
  const attributes = new Map<string, string>();
  const button = {setAttribute(name: string, value: string) { attributes.set(name, value); }};
  const host = Object.assign(Object.create(Example.prototype), {
    _choices: choices,
    __choiceSelected: 0,
    __choiceUpdated: false,
    shadowRoot: {querySelectorAll: () => editors, querySelector: () => button},
    _updateUnsupported() {},
    _updateUnsupportedClass() {},
    _selectChoice(editor: ChoiceEditor) { this.__choiceSelected = Number(editor.dataset.index); },
  });
  return {host, editors, choices, attributes};
}

describe('offline CSS choice state', () => {
  test.each(['filter: blur(5px);', 'filter: opacity(0.25);', ''])(
    'restores the latest choice after theme reloads: %j', async code => {
      const {host, source, messages} = runner();
      await host.postMessage({typ: 'choice', code: 'filter: grayscale(1);'});
      await host.postMessage({typ: 'choice', code});
      for (const theme of ['dark', 'light']) {
        messages.length = 0;
        host.theme.value = theme;
        host.willUpdate();
        expect(JSON.parse(host._iframe.srcdoc).theme).toBe(theme);
        expect(messages).toEqual([]);
        host._onMessage({data: {typ: 'ready'}, source});
        expect(messages).toEqual([{typ: 'choice', code}]);
      }
    },
  );

  test('ignores another frame and restores a choice changed while reloading', async () => {
    const {host, source, messages} = runner();
    await host.postMessage({typ: 'choice', code: 'filter: blur(5px);'});
    host.willUpdate();
    await host.postMessage({typ: 'choice', code: 'filter: contrast(2);'});
    messages.length = 0;
    host._onMessage({data: {typ: 'ready'}, source: {}});
    expect(messages).toEqual([]);
    host._onMessage({data: {typ: 'ready'}, source});
    expect(messages).toEqual([{typ: 'choice', code: 'filter: contrast(2);'}]);
  });

  test('waits for initial readiness before sending the first choice', async () => {
    const {host, source, messages} = runner();
    host.ready = new Promise(resolve => { host._resolveReady = resolve; });
    const sending = host.postMessage({typ: 'choice', code: 'filter: blur(5px);'});
    await Promise.resolve();
    expect(messages).toEqual([]);
    host._onMessage({data: {typ: 'ready'}, source});
    await sending;
    expect(messages).toEqual([{typ: 'choice', code: 'filter: blur(5px);'}]);
  });

  test('does not retain messages for ordinary runners', async () => {
    const {host, source, messages} = runner('ix-tabbed');
    await host.postMessage({typ: 'choice', code: 'filter: blur(5px);'});
    messages.length = 0;
    host._onMessage({data: {typ: 'ready'}, source});
    expect(messages).toEqual([]);
  });

  test('keeps Reset disabled after its delayed editor updates', () => {
    const {host, editors, choices, attributes} = example();
    editors[1].value = 'filter: contrast(2);';
    host._choiceUpdate({target: editors[1]});
    expect(attributes.get('aria-disabled')).toBe('false');
    host._resetChoices();
    // CodeMirror reports programmatic value replacements after its debounce.
    for (const target of editors) host._choiceUpdate({target});
    expect(editors.map(editor => editor.value)).toEqual(choices);
    expect(host.__choiceSelected).toBe(0);
    expect(host.__choiceUpdated).toBe(false);
    expect(attributes.get('aria-disabled')).toBe('true');
    expect(attributes.get('aria-description')).toContain('until you edit');
  });

  test('tracks edits in every choice and disables Reset when all are reverted', () => {
    const {host, editors, choices, attributes} = example();
    for (const target of editors) {
      target.value = '';
      host._choiceUpdate({target});
    }
    editors[0].value = choices[0];
    host._choiceUpdate({target: editors[0]});
    expect(attributes.get('aria-disabled')).toBe('false');
    editors[1].value = choices[1];
    host._choiceUpdate({target: editors[1]});
    expect(attributes.get('aria-disabled')).toBe('true');
    expect(host.__choiceUpdated).toBe(false);
  });
});
