import {localesMap, redirectLocale} from './consts.js';

export const processPathWithMultiLocale = (pathArr: string[], locale: string): boolean => {
  if (!Array.isArray(pathArr) || !pathArr.length) {
    return false;
  }
  let foundDocs, foundLocale;
  for (let i = 0, item; i < pathArr.length; i++) {
    item = pathArr[i];
    if (item === 'docs') {
      foundDocs = true;
    } else if (localesMap[item] || redirectLocale[item]) {
      foundLocale = true;
    } else if (foundLocale && foundDocs) {
      pathArr.splice(0, i, '', locale, 'docs');
      return true;
    } else if (item) {
      return false;
    }
  }
  return false;
};
