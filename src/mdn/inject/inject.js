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
    searchBox,
    // yari theme menu
    themeBtn, themeMenu, currentTheme,
    // yari mobile left sidebar
    sidebarBtn, sidebarContainer, sidebarCurrentElem,
    // yari mask-image to background fix
    linkCss, linkPreload;

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
  // https://github.com/website-local/mdn-local/issues/630
  newTables ='getElementsByClassName' in document ?
    document.getElementsByClassName('bc-table') :
    document.querySelectorAll('.bc-table');
  len = newTables.length;
  for (i = 0; i < len; i++) {
    newTables[i].onclick = browserCompatibilityTableClickListener;
  }

  function browserCompatibilityTableClickListener(e) {
    // noinspection JSDeprecatedSymbols
    e = e || window.event;
    // noinspection ES6ConvertVarToLetConst
    var node, td, button, onToggle, index, i, tr, table, closeTd, section;
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
    onToggle = td.getAttribute('data-on-toggle');
    if (!onToggle) return;
    onToggle = onToggle.split(',');
    index = onToggle[0];
    i = onToggle[1];
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
      if (index === status[0] && i === status[1]) {
        status = null;
        return;
      }
    }
    status = onToggle;
    td.setAttribute('aria-expanded', 'true');
    // this might be removed
    button = td.querySelector('.bc-history-link');
    if (button) {
      addClass(button, 'bc-history-link-inverse');
    }
    section = td.querySelector('.bc-notes-list');
    if (section) {
      removeClass(section, 'bc-hidden');
    }
    tr = table.querySelector('tr.bc-history[key="' + status[0] + '"]');
    if (tr) {
      removeClass(tr, 'bc-hidden');
      node = tr.querySelector('.bc-notes-list');
      if (node && section) {
        node.innerHTML = section.innerHTML;
      }
    }

    function closeHistory() {
      if (!table) return;
      tr = table.querySelector('tr.bc-content-row[key="' + status[0] + '"]');
      if (!tr) return;
      closeTd = tr.querySelector(
        'td[data-on-toggle="' + status.join(',') + '"]');
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
  // https://github.com/website-local/mdn-local/issues/783
  pageHeader = document.querySelector('.main-document-header-container');
  menuToggleBtn = pageHeader && pageHeader.querySelector('.main-menu-toggle');
  pageHeaderMain = pageHeader && (
    pageHeader.querySelector('.page-header-main') ||
    pageHeader.querySelector('.main-menu'));
  if (menuToggleBtn && pageHeaderMain) {
    menuToggleBtn.onclick = function menuToggleBtnClick() {
      // noinspection ES6ConvertVarToLetConst JSDeprecatedSymbols
      var spanIcon = menuToggleBtn.querySelector('span.icon'),
        spanText = menuToggleBtn.querySelector('span.visually-hidden');
      if (hasClass(pageHeader,'show-nav')) {
        removeClass(pageHeader, 'show-nav');
        menuToggleBtn.title = 'Open main menu';
        removeClass(spanIcon, 'icon-cancel');
        addClass(spanIcon, 'icon-menu');
      } else {
        addClass(pageHeader, 'show-nav');
        menuToggleBtn.title = 'Close main menu';
        addClass(spanIcon, 'icon-cancel');
        removeClass(spanIcon, 'icon-menu');
      }
      menuToggleBtn.setAttribute('aria-label', menuToggleBtn.title);
      spanText.innerText = menuToggleBtn.title;
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
        hasClass(node, 'top-level-entry-container')) {
        li = node;
        button = li.querySelector('button.top-level-entry');
      } else if (node.tagName === 'BUTTON' &&
        hasClass(node, 'top-level-entry')) {
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
        addClass(ul, 'hidden');
      } else {
        button.setAttribute('aria-expanded', 'true');
        removeClass(ul, 'hidden');
        nodes = li.parentNode && li.parentNode.children;
        if (!nodes) {
          return;
        }
        for (i = 0; i < nodes.length; i++) {
          if (nodes[i] === li) continue;
          ul = nodes[i].querySelector('ul');
          if (ul) {
            addClass(ul, 'hidden');
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

  /// region yari theme menu
  // https://github.com/website-local/mdn-local/issues/782
  themeBtn = document.querySelector('button.theme-switcher-menu');
  if (themeBtn) {
    themeMenu = document.createElement('ul');
    themeMenu.style.display = 'none';
    themeMenu.style.right = '1rem';
    themeMenu.className = 'submenu themes-menu inline-submenu-lg';
    themeMenu.setAttribute('aria-labelledby', 'themes-menu-button');
    themeBtn.parentNode.append(themeMenu);
    themeMenu.innerHTML = '<li>\n' +
      '<button type="button" class="button primary has-icon active-menu-item">\n' +
      '<span class="button-wrap">\n' +
      '<span class="icon icon-theme-os-default"></span>OS Default</span>\n' +
      '</button></li>\n' +
      '<li>\n' +
      '<button type="button" class="button primary has-icon">\n' +
      '<span class="button-wrap"><span class="icon icon-theme-light"></span>Light</span>\n' +
      '</button>\n' +
      '</li>\n' +
      '<li>\n' +
      '<button type="button" class="button primary has-icon">\n' +
      '<span class="button-wrap"><span class="icon icon-theme-dark"></span>Dark</span>\n' +
      '</button>\n' +
      '</li>';
    themeBtn.onclick = function () {
      if (themeMenu.style.display === 'none') {
        themeMenu.style.display = '';
      } else {
        themeMenu.style.display = 'none';
      }
    };
    themeBtn = themeBtn.querySelector('span.icon');
    themeMenu.onclick = function (e) {
      // noinspection ES6ConvertVarToLetConst
      var theme, el;
      if (e && e.target) {
        switch (e.target.tagName) {
        case 'SPAN':
          if (e.target.className === 'button-wrap') {
            el = e.target.querySelector('span.icon');
          } else if (e.target.className.indexOf('icon-theme-') > -1) {
            el = e.target;
          }
          break;
        case 'BUTTON':
        case 'LI':
          el = e.target.querySelector('span.icon');
          break;
        }
        if (el) {
          theme = el.className.match(/icon-theme-([^ ]+)/);
          if (theme) {
            theme = theme[1];
            if (theme) {
              switchTheme(theme);
            }
          }
        }
      }
    };
    currentTheme = window.localStorage ?
      window.localStorage.getItem('theme') : '';
    if (!currentTheme) {
      currentTheme = 'os-default';
    } else {
      switchTheme(currentTheme);
    }
  }

  /**
   * Posts the name of the theme we are changing to the
   * interactive examples `iframe`.
   * @param theme - The theme to switch to
   */
  function postToIEx(theme) {
    // noinspection ES6ConvertVarToLetConst
    var iexFrame = document.querySelector('.interactive');

    if (iexFrame) {
      if (iexFrame.getAttribute('data-readystate') === 'complete' &&
        iexFrame.contentWindow) {
        iexFrame.contentWindow.postMessage({ theme: theme }, '*');
      }
    }
  }

  function switchTheme(theme) {
    // noinspection ES6ConvertVarToLetConst
    var html = document.documentElement, btn;

    if (window && html) {
      html.className = theme;
      html.style.backgroundColor = '';
      try {
        window.localStorage.setItem('theme', theme);
      } catch (err) {
        console.warn('Unable to write theme to localStorage', err);
      }
      themeBtn.className = 'icon icon-theme-' + theme;
      currentTheme = theme;
      btn = themeMenu.querySelector('.active-menu-item');
      if (btn) {
        removeClass(btn, 'active-menu-item');
      }
      btn = themeMenu.querySelector('.icon-theme-' + theme);
      if (btn) {
        btn = btn.parentNode;
        if (btn) {
          btn = btn.parentNode;
          if (btn) {
            addClass(btn, 'active-menu-item');
          }
        }
      }
      themeMenu.style.display = 'none';
      postToIEx(theme);
    }
  }
  /// endregion yari theme menu

  /// region yari mobile left sidebar
  // https://github.com/website-local/mdn-local/issues/784
  sidebarBtn = document.querySelector('.sidebar-button');
  sidebarContainer = document.getElementById('sidebar-quicklinks');
  if (sidebarBtn && sidebarContainer) {
    sidebarBtn.onclick = function () {
      if (hasClass(sidebarContainer, 'is-expanded')) {
        removeClass(sidebarContainer, 'is-expanded');
        removeClass(document.body, 'mobile-overlay-active');
        sidebarBtn.setAttribute('aria-label', 'Expand sidebar');
        sidebarBtn.setAttribute('aria-expanded', 'false');
      } else {
        addClass(sidebarContainer, 'is-expanded');
        addClass(document.body, 'mobile-overlay-active');
        sidebarBtn.setAttribute('aria-label', 'Collapse sidebar');
        sidebarBtn.setAttribute('aria-expanded', 'true');
      }
    };
    sidebarCurrentElem = sidebarContainer.querySelector('.sidebar em');
    if (sidebarCurrentElem &&
      typeof sidebarCurrentElem.scrollIntoView === 'function') {
      sidebarCurrentElem.scrollIntoView({ block: 'center' });
    }

  }
  /// endregion yari mobile left sidebar

  /// region yari mask-image to background fix
  // https://github.com/website-local/mdn-local/issues/785
  if (window.location.protocol === 'file:') {
    addClass(document.body ||
      document.getElementsByTagName('body')[0], 'mask-fix');
    linkCss = document.querySelector('link[rel="stylesheet"][href*="main."]');
    if (linkCss) {
      linkPreload = document.createElement('link');
      linkPreload.href = linkCss.href.replace(/\.css$/, '_file.css');
      linkPreload.rel = 'preload';
      linkPreload.as = 'style';
      document.head.appendChild(linkPreload);
      setTimeout(function () {
        linkCss.href =  linkPreload.href;
      }, 15);

    }
  }
  /// endregion yari mask-image to background fix
}();
