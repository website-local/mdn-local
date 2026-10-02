import {describe, expect, test} from '@jest/globals';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {load} from 'cheerio';

const injected = readFileSync(new URL('../../src/mdn/inject/inject.js', import.meta.url), 'utf8');

describe('offline navigation controls', () => {
  test('About tabs wrap with Left/Right and keep selection, hash and focus together', () => {
    let focused = '';
    class Tab extends EventTarget {
      attributes = new Map<string, string>();
      classList = {toggle() {}, add() {}};
      constructor(public dataset: {panelId: string}) { super(); }
      setAttribute(name: string, value: string) { this.attributes.set(name, value); }
      getBoundingClientRect() { return {top: 1}; }
      click() { this.dispatchEvent(new Event('click', {cancelable: true})); }
      focus() { focused = this.dataset.panelId; }
    }
    const tabs = ['overview', 'our_team', 'our_partners'].map(panelId => new Tab({panelId}));
    const panels = tabs.map(tab => new Tab(tab.dataset));
    const window = Object.assign(new EventTarget(), {location: {hash: ''}});
    const source = injected.split('/// region fred mdn-about-tabs')[1]
      .split('/// endregion mdn-about-tabs')[0];
    runInNewContext(source, {
      window,
      document: {querySelectorAll: () => [{querySelectorAll: (selector: string) =>
        selector === '[slot="tab"]' ? tabs : panels}]},
    });
    const press = (index: number, key: string, selected: number) => {
      const event = Object.assign(new Event('keydown', {cancelable: true}), {key});
      tabs[index].dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      expect(window.location.hash).toBe(tabs[selected].dataset.panelId);
      expect(focused).toBe(tabs[selected].dataset.panelId);
      expect(tabs.map(tab => tab.attributes.get('aria-selected')))
        .toEqual(tabs.map((_, i) => String(i === selected)));
      expect(panels.map(panel => panel.attributes.get('aria-hidden')))
        .toEqual(panels.map((_, i) => String(i !== selected)));
    };
    press(0, 'ArrowLeft', 2);
    press(2, 'ArrowRight', 0);
    press(0, 'ArrowRight', 1);
    const vertical = Object.assign(new Event('keydown', {cancelable: true}), {key: 'ArrowDown'});
    tabs[1].dispatchEvent(vertical);
    expect(vertical.defaultPrevented).toBe(false);
    expect(focused).toBe('our_team');
  });

  test.each(['', ' ', '\t'])('sidebar filtering tolerates an empty trimmed query %j', query => {
    const source = 'class MDNSidebarFilter' + injected.split('class MDNSidebarFilter')[1]
      .split('const currentPage =')[0];
    const Filter = runInNewContext(`${source}; MDNSidebarFilter;`, {});
    const filter = new Filter();
    const applied: string[] = [];
    filter._quicklinks = {dataset: {}, scrollTop: 0};
    filter._filterer = {applyFilter(value: string) { applied.push(value); }};
    filter.input = {getRootNode: () => ({querySelector: () => null})};
    filter.query = query;
    expect(() => filter.updated()).not.toThrow();
    expect(applied).toEqual(['']);
  });

  test('clearing the sidebar restores the input and its clear-button visibility', () => {
    const button = {style: {visibility: 'initial'}, onclick: () => {}};
    const input = {value: 'filter', oninput: () => {}};
    let cleared = 0;
    const source = 'const elem = document.querySelector(\'mdn-sidebar-filter\');' +
      injected.split('const elem = document.querySelector(\'mdn-sidebar-filter\');')[1]
        .split('if (location.protocol !== \'file:\')')[0];
    runInNewContext(`(() => { ${source} })()`, {
      MDNSidebarFilter: class {
        firstUpdated() {}
        _clearFilter() { cleared++; }
      },
      document: {querySelector: () => ({shadowRoot: {
        querySelector: (selector: string) => selector === 'input' ? input : button,
      }})},
    });
    button.onclick();
    expect(cleared).toBe(1);
    expect(input.value).toBe('');
    expect(button.style.visibility).toBe('');
  });

  test('removing filter highlights preserves original link spans and status icons', () => {
    const source = 'class SidebarFilterer' + injected.split('class SidebarFilterer')[1]
      .split('class MDNSidebarFilter')[0];
    const Filter = runInNewContext(`${source}; SidebarFilterer;`, {
      document: {createTextNode: (text: string) => text},
    });
    const $ = load('<a><span class="label">API</span><span class="icon icon-experimental"></span>' +
      '<span class="sidebar-filter-mark-container"><mark>Filter</mark> value</span></a>');
    const link = {querySelectorAll: (selector: string) => $('a').find(selector).toArray().map(node => ({
      textContent: $(node).text(),
      parentElement: {normalize() {}},
      replaceWith(text: string) { $(node).replaceWith(text); },
    }))};
    Filter.prototype.resetHighlighting.call({}, link);
    expect($('a .label').text()).toBe('API');
    expect($('a .icon-experimental')).toHaveLength(1);
    expect($('a mark, a .sidebar-filter-mark-container')).toHaveLength(0);
    expect($('a').text()).toBe('APIFilter value');
  });

  test.each([false, true])('theme controls follow OS changes when system dark is %s', systemDark => {
    const button = {dataset: {mode: 'light dark'}};
    const container = {dataset: {theme: ''}};
    class Option {
      attributes = new Map<string, string>();
      onclick: (event: {target: Option}) => void = () => {};
      constructor(public dataset: {mode: string}) {}
      getRootNode() { return shadow; }
      setAttribute(name: string, value: string) { this.attributes.set(name, value); }
      removeAttribute(name: string) { this.attributes.delete(name); }
    }
    const options = ['light dark', 'light', 'dark'].map(mode => new Option({mode}));
    const systemTheme = Object.assign(new EventTarget(), {matches: systemDark});
    let savedMode = '';
    const shadow = {
      activeElement: null,
      querySelectorAll: () => options,
      querySelector: (selector: string) => selector === '.color-theme' ? container : button,
    };
    const document = {
      documentElement: {dataset: {theme: ''}},
      body: {dispatchEvent() {}},
      querySelector: () => null,
      querySelectorAll: () => [{shadowRoot: shadow}],
    };
    const source = injected.split('// 20251005 theme switcher')[1].split('// 20251005 toc-highlight')[0];
    runInNewContext(source, {
      document, HTMLElement: Option, location: {protocol: 'https:'},
      window: {matchMedia: () => systemTheme},
      localStorage: {getItem: () => null, setItem(_key: string, value: string) { savedMode = value; }},
      CustomEvent: class {},
    });
    for (const option of [...options].reverse()) {
      option.onclick({target: option});
      const expected = option.dataset.mode === 'light dark' ? (systemDark ? 'dark' : 'light') : option.dataset.mode;
      expect(document.documentElement.dataset.theme).toBe(expected);
      expect(button.dataset.mode).toBe(option.dataset.mode);
      expect(options.filter(value => value.attributes.has('data-current'))).toEqual([option]);
    }
    systemTheme.matches = !systemDark;
    systemTheme.dispatchEvent(new Event('change'));
    expect(document.documentElement.dataset.theme).toBe(systemDark ? 'light' : 'dark');
    expect(container.dataset.theme).toBe(document.documentElement.dataset.theme);
    expect(button.dataset.mode).toBe('light dark');
    expect(savedMode).toBe('light dark');
    options[1].onclick({target: options[1]});
    systemTheme.matches = systemDark;
    systemTheme.dispatchEvent(new Event('change'));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(savedMode).toBe('light');
  });
});
