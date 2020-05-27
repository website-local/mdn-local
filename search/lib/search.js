'use strict';
/* global document window */
!function () {
  // noinspection ES6ConvertVarToLetConst
  var headerSearch, toggleSearch, span,
    mainMenu, mainMenuItems, mainMenuItemLen, mainMenuToggle;
  if ((mainMenu = document.querySelector('ul.main-menu')) &&
    (mainMenuItems = mainMenu.querySelectorAll('li > ul')) &&
    (mainMenuItemLen = mainMenuItems.length)) {
    window.addEventListener('click', function (e) {
      // noinspection ES6ConvertVarToLetConst
      var nextSibling, i, menu;
      // noinspection JSUnresolvedVariable
      if (e.target.className !== 'top-level-entry' ||
        !(nextSibling = e.target.nextSibling)) {
        for (i = 0; i < mainMenuItemLen; i++) {
          menu = mainMenuItems[i];
          menu.setAttribute('aria-expanded', false);
          menu.className = '';
        }
        return;
      }
      e.preventDefault();
      if (nextSibling.className === 'show') {
        nextSibling.setAttribute('aria-expanded', false);
        nextSibling.className = '';
      } else {
        for (i = 0; i < mainMenuItemLen; i++) {
          menu = mainMenuItems[i];
          if (menu === nextSibling) {
            menu.setAttribute('aria-expanded', true);
            menu.className = 'show';
          } else {
            menu.setAttribute('aria-expanded', false);
            menu.className = '';
          }
        }
      }
    });
  }
  if (mainMenu &&
    (mainMenuToggle = document.querySelector('.main-menu-toggle'))) {
    mainMenuToggle.addEventListener('click', function () {
      if (mainMenu.className === 'main-menu show') {
        mainMenuToggle.className = 'ghost main-menu-toggle';
        mainMenu.className = 'main-menu';
      } else {
        mainMenuToggle.className = 'ghost main-menu-toggle expanded';
        mainMenu.className = 'main-menu show';
      }
    });
  }
  if (!(headerSearch = document.querySelector('.header-search')) ||
    !(toggleSearch = headerSearch.querySelector('.toggle-form')) ||
    !(span = toggleSearch.querySelector('span'))) {
    return;
  }
  toggleSearch.addEventListener('click', function (e) {
    e.preventDefault();
    if (headerSearch.className.indexOf('show-form') < 0) {
      headerSearch.className = 'header-search show-form';
      span.innerText = '${config.text.closeSearch}';
    } else {
      headerSearch.className = 'header-search';
      span.innerText = '${config.text.openSearch}';
    }
  });
}();
