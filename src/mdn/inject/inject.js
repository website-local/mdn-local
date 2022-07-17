'use strict';
/* global document window */
!function () {
  /// region top-level vars
  // noinspection ES6ConvertVarToLetConst
  var htabs, desktops, mobiles, len, i, j, htab, links, a,
    // yari new compatibility table
    newTables, status = null,
    // yari expandable top menu
    pageHeader, menuToggleBtn, pageHeaderMain, toggleSearchBtn,
    // yari main-menu nojs
    mainMenuNoJs,
    // yari search box on main page
    searchBox;

  /// endregion top-level vars

  /// region class utils
  /**
   * @param {Element} elem
   * @param {string} className
   * @return {void}
   */
  function addClass(elem, className) {
    if ('classList' in elem && typeof elem.classList.add === 'function') {
      elem.classList.add(className);
      return;
    }
    // noinspection ES6ConvertVarToLetConst
    var classes = elem.className.split(/\s+/), i;
    for (i = 0; i < classes.length; i++) {
      if (classes[i] === className) {
        return;
      }
    }
    elem.setAttribute('class',
      elem.className + ' ' + className);
  }

  /**
   * @param {Element} elem
   * @param {string} className
   * @return {void}
   */
  function removeClass(elem, className) {
    if ('classList' in elem && typeof elem.classList.remove === 'function') {
      elem.classList.remove(className);
      return;
    }
    // noinspection ES6ConvertVarToLetConst
    var classes = elem.className.split(/\s+/), copy = [], i, j = 0;
    for (i = 0; i < classes.length; i++) {
      if (classes[i] !== className) {
        copy[j++] = classes[i];
      }
    }
    if (copy.length < classes.length) {
      elem.setAttribute('class', copy.join(' '));
    }
  }

  /**
   * @param {Element} elem
   * @param {string} className
   * @return {boolean}
   */
  function hasClass(elem, className) {
    if ('classList' in elem && typeof elem.classList.contains === 'function') {
      return elem.classList.contains(className);
    }
    // noinspection ES6ConvertVarToLetConst
    var classes = elem.className.split(/\s+/), i;
    for (i = 0; i < classes.length; i++) {
      if (classes[i] === className) {
        return true;
      }
    }
    return false;
  }
  /// endregion class utils

  /// region old compatibility table
  // old compatibility table script, missing from official site
  // implemented with pure js
  // noinspection ES6ConvertVarToLetConst
  htabs = 'getElementsByClassName' in document ?
    document.getElementsByClassName('htab') :
    document.querySelectorAll('.htab');
  desktops = document.querySelectorAll('div[id=compat-desktop]');
  mobiles = document.querySelectorAll('div[id=compat-mobile]');
  len = htabs.length;

  function changeTabListener(e) {
    // noinspection JSDeprecatedSymbols
    e = e || window.event;
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    // noinspection ES6ConvertVarToLetConst
    var li, ul, i, index, selfIndex, elems, tab;
    if (!(li = this.parentNode)) return false;
    if ((ul = li.parentNode)) {
      index = 0;
      elems = ul.childNodes;
      for (i = 0; i < elems.length; i++) {
        if (elems[i].tagName !== 'LI') {
          continue;
        }
        if (elems[i] === li) {
          selfIndex = index;
          addClass(elems[i], 'selected');
        } else {
          removeClass(elems[i], 'selected');
        }
        ++index;
      }
    }
    if ((tab = ul.parentNode)) {
      index = 0;
      elems = tab.childNodes;
      for (i = 0; i < elems.length; i++) {
        if (elems[i].tagName !== 'DIV') {
          continue;
        }
        if (index++ === selfIndex) {
          elems[i].style.display = '';
        } else {
          elems[i].style.display = 'none';
        }
      }
    }
  }

  for (i = 0; i < len; i++) {
    htab = htabs[i];
    links = htab.querySelectorAll('ul>li>a');
    if (desktops[i]) {
      // noinspection JSCheckFunctionSignatures
      htab.appendChild(desktops[i]);
    }
    if (mobiles[i]) {
      // noinspection JSCheckFunctionSignatures
      htab.appendChild(mobiles[i]);
    }
    for (j = 0; j < links.length; j++) {
      a = links[j];
      a.onclick = changeTabListener;
      if (j === 0) {
        changeTabListener.call(a);
      }
    }
  }
  /// endregion old compatibility table

  /// region yari new compatibility table
  newTables ='getElementsByClassName' in document ?
    document.getElementsByClassName('bc-table') :
    document.querySelectorAll('.bc-table');
  len = newTables.length;
  for (i = 0; i < len; i++) {
    newTables[i].onclick = browserCompatibilityTableClickListener;
  }

  // compatible with minimal IE9 since it uses firstElementChild
  function browserCompatibilityTableClickListener(e) {
    // noinspection JSDeprecatedSymbols
    e = e || window.event;
    // noinspection ES6ConvertVarToLetConst
    var node, td, button, tdKey, tr, trKey, table, closeTd, section;
    // noinspection JSDeprecatedSymbols
    node = e.target || e.srcElement;
    if (node.tagName === 'TD') {
      td = node;
    } else {
      while (node && (node = node.parentNode)) {
        if (node.tagName === 'TD') {
          td = node;
          break;
        }
      }
    }
    if (!td) return;
    // td.classList.contains('bc-has-history')
    if (!hasClass(td, 'bc-has-history')) {
      return;
    }
    tdKey = td.getAttribute('key');
    if (!tdKey) return;
    tr = td.parentNode;
    if (!tr) return;
    trKey = tr.getAttribute('key');
    if (!tdKey) return;
    node = td;
    while (node && (node = node.parentNode)) {
      if (node.tagName === 'TABLE') {
        table = node;
        break;
      }
    }
    if (!table) return;
    if (status !== null) {
      closeHistory();
      if (trKey === status[0] && tdKey === status[1]) {
        status = null;
        return;
      }
    }
    status = [trKey, tdKey];
    td.setAttribute('aria-expanded', 'true');
    button = td.querySelector('.bc-history-link');
    if (button) {
      addClass(button, 'bc-history-link-inverse');
    }
    section = td.querySelector('.bc-history');
    if (section) {
      removeClass(section, 'bc-hidden');
    }
    tr = table.querySelector('tr.bc-history[key="' + status[0] + '"]');
    if (tr) {
      removeClass(tr, 'bc-hidden');
      node = tr.querySelector('.bc-history-content');
      if (node && section) {
        node.innerHTML = section.innerHTML;
      }
    }

    function closeHistory() {
      if (!table) return;
      tr = table.querySelector('tr.bc-content-row[key="' + status[0] + '"]');
      if (!tr) return;
      closeTd = tr.querySelector('td[key="' + status[1] + '"]');
      if (!closeTd) return;
      closeTd.setAttribute('aria-expanded', 'false');
      button = closeTd.querySelector('.bc-history-link');
      if (button) {
        removeClass(button, 'bc-history-link-inverse');
      }
      section = closeTd.querySelector('.bc-history');
      if (section) {
        addClass(section, 'bc-hidden');
      }
      tr = table.querySelector('tr.bc-history[key="' + status[0] + '"]');
      if (tr) {
        addClass(tr, 'bc-hidden');
      }

    }
  }

  /// endregion yari new compatibility table

  /// region yari expandable top menu
  pageHeader = document.querySelector('.page-header');
  menuToggleBtn = pageHeader && pageHeader.querySelector('.main-menu-toggle');
  pageHeaderMain = pageHeader && (
    pageHeader.querySelector('.page-header-main') ||
    pageHeader.querySelector('.main-menu'));
  if (menuToggleBtn && pageHeaderMain) {
    menuToggleBtn.onclick = function menuToggleBtnClick() {
      // endsWith(' show')
      if (hasClass(pageHeaderMain,'show')) {
        removeClass(pageHeaderMain, 'show');
        removeClass(menuToggleBtn, 'expanded');
      } else {
        addClass(pageHeaderMain, 'show');
        addClass(menuToggleBtn, 'expanded');
      }
    };
  }
  if (pageHeaderMain) {
    pageHeaderMain.onclick = function pageHeaderMainClick(e) {
      // noinspection JSDeprecatedSymbols
      e = e || window.event;
      // noinspection ES6ConvertVarToLetConst JSDeprecatedSymbols
      var node = e.target, button, li, ul, attr, nodes, i;
      if (!node) {
        // noinspection JSDeprecatedSymbols
        node = e.srcElement;
      }
      if (node.tagName === 'LI' &&
        node.className === 'top-level-entry-container') {
        li = node;
        button = li.querySelector('button.top-level-entry');
      } else if (node.tagName === 'BUTTON' &&
        node.className === 'top-level-entry') {
        button = node;
        li = node.parentNode;
      } else {
        return;
      }
      if (!button || !li) return;
      ul = li.querySelector('ul');
      if (!ul) return;
      attr = button.getAttribute('aria-expanded');
      if (attr === 'true') {
        button.setAttribute('aria-expanded', 'false');
        // ul.classList.remove('show')
        removeClass(ul, 'show');
      } else {
        button.setAttribute('aria-expanded', 'true');
        addClass(ul, 'show');
        nodes = li.parentNode && li.parentNode.children;
        if (!nodes) {
          return;
        }
        for (i = 0; i < nodes.length; i++) {
          if (nodes[i] === li) continue;
          ul = nodes[i].querySelector('ul');
          if (ul) {
            removeClass(ul, 'show');
          }
          button = nodes[i].querySelector('button.top-level-entry');
          if (button) {
            button.setAttribute('aria-expanded', 'false');
          }
        }
      }
    };
    // https://github.com/website-local/mdn-local/issues/360
    window.onblur = function windowOnBlurCloseHeaderMenu() {
      // noinspection ES6ConvertVarToLetConst JSDeprecatedSymbols
      var el = pageHeader.querySelector(
        '.top-level-entry[aria-expanded="true"]');
      if (el) {
        el.click();
      }
    };
    window.onclick = function windowOnClickCloseHeaderMenu(e) {

      // noinspection JSDeprecatedSymbols
      e = e || window.event;
      // noinspection ES6ConvertVarToLetConst JSDeprecatedSymbols
      var node = e.target;
      if (!node) {
        // noinspection JSDeprecatedSymbols
        node = e.srcElement;
      }
      do {
        if (node === pageHeader) {
          return;
        }
      } while ((node = node.parentNode));
      window.onblur(e);
    };
  }

  /// endregion yari expandable top menu

  searchBox = document.querySelector('.homepage-hero-search');
  if (searchBox) {
    addClass(searchBox, 'hide');
  }

  /// region yari expandable mobile search
  toggleSearchBtn = document.querySelector('.toggle-form');
  if (toggleSearchBtn) {
    toggleSearchBtn.onclick = function toggleSearchBtnClick() {
      // noinspection ES6ConvertVarToLetConst
      var parent, closeIcon, searchIcon;
      parent = toggleSearchBtn.parentNode;
      if (!parent) {
        return;
      }
      closeIcon = toggleSearchBtn.querySelector('.close-icon');
      searchIcon = toggleSearchBtn.querySelector('.search-icon');
      if (hasClass(parent, 'show-form')) {
        removeClass(parent, 'show-form');
        if (closeIcon) {
          // Uncaught TypeError: setting getter-only property "className"
          // this is a svg
          removeClass(closeIcon, 'hide');
        }
        if (searchIcon) {
          addClass(searchIcon, 'hide');
        }
      } else {
        addClass(parent, 'show-form');
        if (closeIcon) {
          addClass(closeIcon, 'hide');
        }
        if (searchIcon) {
          removeClass(searchIcon, 'hide');
        }
      }
    };
  }
  /// endregion yari expandable mobile search

  /// region yari lowercase all anchor IDs and recover if not lowercase
  // https://github.com/mdn/yari/pull/2266
  function lowerCaseLocationHash() {
    // noinspection ES6ConvertVarToLetConst
    var location = document.location;
    // Did you arrive on this page with a location hash?
    if (location.hash && location.hash !== location.hash.toLowerCase()) {
      // The location hash isn't lowercase. That probably means it's from before
      // we made all `<h2 id>` and `<h3 id>` values always lowercase.
      // Let's see if it can easily be fixed, but let's be careful and
      // only do this if there is an element that matches.
      try {
        if (document.querySelector(location.hash.toLowerCase())) {
          // use location.replace to perform better in forward/back actions
          location.replace(location.hash.toLowerCase());
        }
      } catch (error) {
        // You can't assume that the anchor on the page is a valid string
        // for `document.querySelector()`.
        // E.g. /en-US/docs/Web/HTML/Element/input#Form_<input>_types
        // So if that the case, just ignore the error.
        // It's not that critical to correct anyway.
        // https://github.com/mdn/yari/issues/2475
      }
    }
  }

  window.onhashchange = lowerCaseLocationHash;
  lowerCaseLocationHash();

  /// endregion yari lowercase all anchor IDs and recover if not lowercase

  /// region yari main-menu nojs
  if (pageHeader) {
    mainMenuNoJs = document.querySelector('.main-menu.nojs');
    if (mainMenuNoJs) {
      removeClass(mainMenuNoJs, 'nojs');
    }
  }
  /// endregion yari main-menu nojs
}();
