'use strict';
/* global document window */
!function () {
  /// region top-level vars
  // noinspection ES6ConvertVarToLetConst
  var htabs,desktops,mobiles,len, i, j, htab, links, a,
    // yari new compatibility table
    newTables, status = null,
    // yari expandable top menu
    pageHeader, menuToggleBtn, pageHeaderMain, toggleSearchBtn;
  /// endregion top-level vars

  /// region old compatibility table
  // old compatibility table script, missing from official site
  // implemented with pure js
  // noinspection ES6ConvertVarToLetConst
  htabs = document.getElementsByClassName('htab');
  desktops = document.querySelectorAll('div[id=compat-desktop]');
  mobiles = document.querySelectorAll('div[id=compat-mobile]');
  len = htabs.length;

  function changeTabListener(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
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
          elems[i].classList.add('selected');
        } else {
          elems[i].classList.remove('selected');
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
      a.addEventListener('click', changeTabListener);
      if (j === 0) {
        changeTabListener.call(a);
      }
    }
  }
  /// endregion old compatibility table

  /// region yari new compatibility table
  newTables =
    document.getElementsByClassName('bc-table');
  len = newTables.length;
  for (i = 0; i < len; i++) {
    newTables[i].onclick = browserCompatibilityTableClickListener;
  }
  // compatible with minimal IE9 since it uses parentElement and firstElementChild
  function browserCompatibilityTableClickListener(e) {
    // noinspection ES6ConvertVarToLetConst
    var node, td, button, tdKey, tr, trKey, table, closeTd, section;
    node = e.target;
    if (node.tagName === 'TD') {
      td = node;
    } else {
      while (node && (node = node.parentElement)) {
        if (node.tagName === 'TD') {
          td = node;
          break;
        }
      }
    }
    if (!td) return;
    // td.classList.contains('bc-has-history')
    if (!td.className.match(/(\s|^)bc-has-history(\s|$)/)) {
      return;
    }
    tdKey = td.getAttribute('key');
    if (!tdKey) return;
    tr = td.parentElement;
    if (!tr) return;
    trKey = tr.getAttribute('key');
    if (!tdKey) return;
    node = td;
    while (node && (node = node.parentElement)) {
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
      button.className = 'bc-history-link only-icon bc-history-link-inverse';
    }
    section = td.querySelector('.bc-history');
    if (section) {
      section.className = 'bc-history bc-history-mobile';
    }
    tr = table.querySelector('tr.bc-history[key="' + status[0] + '"]');
    if (tr) {
      tr.className = 'bc-history';
      node = tr.querySelector('.bc-history-content');
      if (node && section.firstElementChild) {
        node.innerHTML = section.firstElementChild.innerHTML;
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
        button.className = 'bc-history-link only-icon';
      }
      section = closeTd.querySelector('.bc-history');
      if (section) {
        section.className = 'bc-history bc-history-mobile bc-hidden';
      }
      tr = table.querySelector('tr.bc-history[key="' + status[0] + '"]');
      if (tr) {
        tr.className = 'bc-history bc-hidden';
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
      if (pageHeaderMain.className.match(/ show$/)) {
        pageHeaderMain.className = pageHeaderMain.className
          .replace(/ show$/, '');
        menuToggleBtn.className = 'ghost main-menu-toggle';
      } else {
        pageHeaderMain.className += ' show';
        menuToggleBtn.className = 'ghost main-menu-toggle expanded';
      }
    };
  }
  if (pageHeaderMain) {
    pageHeaderMain.onclick = function pageHeaderMainClick(e) {
      // noinspection ES6ConvertVarToLetConst
      var node = e.target, button, li, ul, attr, nodes, i;
      if (node.tagName === 'LI' &&
        node.className === 'top-level-entry-container') {
        li = node;
        button = li.querySelector('button.top-level-entry');
      } else if (node.tagName === 'BUTTON' &&
        node.className === 'top-level-entry') {
        button = node;
        li = node.parentElement;
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
        ul.className = ul.className.replace(/ show$/, '');
      } else {
        button.setAttribute('aria-expanded', 'true');
        ul.className += ' show';
        nodes = li.parentElement && li.parentElement.children;
        if (!nodes) {
          return;
        }
        for (i = 0; i < nodes.length; i++) {
          if (nodes[i] === li) continue;
          ul = nodes[i].querySelector('ul');
          if (ul) {
            ul.className = ul.className.replace(/ show$/, '');
          }
          button = nodes[i].querySelector('button.top-level-entry');
          if (button) {
            button.setAttribute('aria-expanded', 'false');
          }
        }
      }
    };
  }

  /// endregion yari expandable top menu

  /// region yari expandable mobile search
  toggleSearchBtn = document.querySelector('.toggle-form');
  if (toggleSearchBtn) {
    toggleSearchBtn.onclick = function toggleSearchBtnClick() {
      // noinspection ES6ConvertVarToLetConst
      var parent, closeIcon, searchIcon;
      parent = toggleSearchBtn.parentElement;
      if (!parent) {
        return;
      }
      closeIcon = toggleSearchBtn.querySelector('.close-icon');
      searchIcon = toggleSearchBtn.querySelector('.search-icon');
      if (parent.className.match(/ show-form$/)) {
        parent.className =
          parent.className.replace(/ show-form$/, '');
        if (closeIcon) {
          // Uncaught TypeError: setting getter-only property "className"
          // this is a svg
          closeIcon.setAttribute('class', 'close-icon');
        }
        if (searchIcon) {
          searchIcon.setAttribute('class',  'search-icon hide');
        }
      } else {
        parent.className += ' show-form';
        if (closeIcon) {
          closeIcon.setAttribute('class', 'close-icon hide');
        }
        if (searchIcon) {
          searchIcon.setAttribute('class', 'search-icon');
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
      if (document.querySelector(location.hash.toLowerCase())) {
        // use location.replace to perform better in forward/back actions
        location.replace(location.hash.toLowerCase());
      }
    }
  }
  lowerCaseLocationHash();
  window.onhashchange = lowerCaseLocationHash;

  /// endregion yari lowercase all anchor IDs and recover if not lowercase
}();
