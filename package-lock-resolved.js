/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
// true to remove the resolved property from dependencies
// false to convent the awful registry.npm.taobao.org url to registry.npmjs.org
const remove = process.env.NPM_PACKAGE_LOCK_REMOVE_RESOLVED || false;

// since this is the only file reading, using sync io is acceptable
const packageLock =
  JSON.parse(fs.readFileSync(path.join(__dirname, 'package-lock.json'), {
    encoding: 'utf8'
  }));

processDependency(packageLock);

fs.writeFileSync(path.join(__dirname, 'package-lock.json'),
  // to make github dependabot happy
  JSON.stringify(packageLock, null, 2) + '\n');

/**
 * @param {string} resolved
 * @param dependency
 */
function processDependencyUrl(resolved, dependency) {
  if (remove) {
    if (resolved.includes('registry.npmjs.org')) {
      delete dependency.resolved;
    }
  } else if (resolved.includes('registry.npm.taobao.org')) {
    const resolvedParts = resolved.split('/');
    let status = 0, lastIndex = 0, packageName, fileName;
    for (let i = 0; i < resolvedParts.length; i++) {
      switch (resolvedParts[i]) {
      case 'registry.npm.taobao.org':
        status = 1;
        lastIndex = i;
        break;
      case 'download':
        if (status === 1 && lastIndex &&
          // note that there is a package called download
          (resolvedParts[lastIndex + 1] === resolvedParts[i + 1] ||
            resolvedParts[i + 1].startsWith(resolvedParts[lastIndex + 1] + '-'))) {
          packageName = resolvedParts.slice(lastIndex + 1, i).join('/');
          status = 2;
        }
        break;
      }
    }
    if (status === 2) {
      fileName = resolvedParts[resolvedParts.length - 1];
      let idx = fileName.indexOf('?');
      if (packageName && idx > 0) {
        fileName = fileName.slice(0, idx);
      }
      if (fileName.endsWith('.tgz')) {
        dependency.resolved = `https://registry.npmjs.org/${packageName}/-/${fileName}`;
      }
    }
  }
}

function processDependency(dependency) {
  const {resolved} = dependency;
  if (resolved) {
    processDependencyUrl(resolved, dependency);
  }
  if (dependency.dependencies) {
    processDependencies(dependency.dependencies);
  }
}

function processDependencies(dependencies) {
  for (const key of Object.keys(dependencies)){
    processDependency(dependencies[key]);
  }
}
