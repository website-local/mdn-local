import {describe, expect, test} from '@jest/globals';
import {readFileSync} from 'node:fs';
import {createContext, runInContext, runInNewContext} from 'node:vm';
import {load} from 'cheerio';
import {renderHtml} from '../../../src/mdn/process-html/process-playground.js';

const injected = readFileSync(new URL('../../../src/mdn/inject/inject.js', import.meta.url), 'utf8');
const renderer = injected.split('/// region render-html')[1].split('/// endregion render-html')[0];
const renderInteractive = runInNewContext(`${renderer}; renderHtml;`, {relativeRoot: ''}) as typeof renderHtml;

function execute(html: string) {
  const callbacks: (() => void)[] = [];
  const warnings: string[] = [];
  const errors: unknown[] = [];
  const context = createContext({
    console: {log() {}, warn(message: string) { warnings.push(message); }},
    parent: {postMessage() {}},
    addEventListener() {},
    document: {
      body: {innerHTML: ''},
      addEventListener(event: string, callback: () => void) {
        if (event === 'DOMContentLoaded') callbacks.push(callback);
      },
    },
  });
  runInContext('window = globalThis;', context);
  const $ = load(html);
  $('script').each((_, element) => {
    try {
      runInContext($(element).text(), context);
    } catch (error) {
      // Like a browser, continue to the next script after a script error.
      errors.push(error);
    }
  });
  callbacks.forEach(callback => callback());
  return {ran: context.sampleRan === true, warnings, errors};
}

describe.each([
  ['static live samples', renderHtml],
  ['interactive examples', renderInteractive],
] as const)('%s runner', (_, render) => {
  test.each([
    '<p>ok</p>', '<div', '<div title="', '<div title=\'', '<!-- unfinished', '<script>',
  ])('reaches sample JavaScript after %s', html => {
    const result = execute(render({html, css: '', js: 'window.sampleRan = true;'}));
    expect(result.ran).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  test('warns when raw-text HTML consumes the runner', () => {
    const result = execute(render({html: '<textarea>', css: '', js: 'window.sampleRan = true;'}));
    expect(result.ran).toBe(false);
    expect(result.warnings).toEqual([expect.stringContaining('The JavaScript did not run')]);
  });

  test('does not warn when the sample replaces the body', () => {
    const result = execute(render({html: '<p>ok</p>', css: '', js: 'document.body.innerHTML = ""; window.sampleRan = true;'}));
    expect(result.ran).toBe(true);
    expect(result.warnings).toEqual([]);
    expect(result.errors).toEqual([]);
  });
});
