import {describe, expect, test} from '@jest/globals';
import {load} from 'cheerio';
import {
  postProcessExternalizeStandalonePlaygroundLinks,
  postProcessReplaceOnlineOnlyMdnWidgets,
} from '../../../src/mdn/process-html/process-external.js';

describe('process-external', () => {
  test('externalizes locale-root playground links', () => {
    const $ = load(`
      <a id="root" href="play.html">Playground</a>
      <a id="nested" href="../../play.html?state=abc#code">MDN Playground</a>
      <a id="absolute" href="/en-US/play/">Play</a>
      <a id="unknown-locale" href="/not-a-locale/play">Unknown</a>
      <a id="api" href="Web/API/HTMLMediaElement/play.html">HTMLMediaElement.play()</a>
      <a id="event" href="play_event.html">play event</a>
    `);

    postProcessExternalizeStandalonePlaygroundLinks(
      $,
      'https://developer.mozilla.org/zh-CN/docs/Learn_web_development'
    );

    expect($('#root').attr('href')).toBe('https://developer.mozilla.org/zh-CN/play');
    expect($('#nested').attr('href')).toBe(
      'https://developer.mozilla.org/zh-CN/play?state=abc#code'
    );
    expect($('#absolute').attr('href')).toBe('https://developer.mozilla.org/en-US/play');
    expect($('#root').attr('target')).toBe('_blank');
    expect($('#root').attr('rel')).toBe('noopener noreferrer');
    expect($('#root').hasClass('external')).toBe(true);
    expect($('#unknown-locale').attr('href')).toBe('/not-a-locale/play');
    expect($('#api').attr('href')).toBe('Web/API/HTMLMediaElement/play.html');
    expect($('#event').attr('href')).toBe('play_event.html');
  });

  test('replaces online-only Observatory widgets with live MDN links', () => {
    const $ = load(`
      <main>
        <mdn-observatory-form></mdn-observatory-form>
        <mdn-observatory-results></mdn-observatory-results>
        <mdn-observatory-tests-and-scores></mdn-observatory-tests-and-scores>
      </main>
    `);

    postProcessReplaceOnlineOnlyMdnWidgets(
      $,
      'https://developer.mozilla.org/zh-CN/observatory'
    );

    expect($('mdn-observatory-form')).toHaveLength(0);
    expect($('mdn-observatory-results')).toHaveLength(0);
    expect($('mdn-observatory-tests-and-scores')).toHaveLength(0);
    expect($('a[href="https://developer.mozilla.org/zh-CN/observatory"]'))
      .toHaveLength(2);
    expect($('a[href="https://developer.mozilla.org/en-US/observatory/docs/tests_and_scoring"]'))
      .toHaveLength(1);
    expect($('a.external[target="_blank"][rel="noopener noreferrer"]'))
      .toHaveLength(3);
  });
});
