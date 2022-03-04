const { resolve } = require('path');
const { callbackify } = require('../utils/Func');

module.exports = (initialData = {}, base = '/') => {
  const filesystem = {};

  const _mkdirp = (path) => [...path.matchAll('/'), {}]
    .map(({ index }) => (index === 0 ? '/' : path.substring(0, index)))
    .forEach((partial) => (filesystem[partial] = null));

  const _resolve = (path) => resolve(base, path);

  const init = () => {
    for (const path of Object.keys(filesystem)) {
      delete filesystem[path];
    }
    _mkdirp(base);
    for (const path of Object.keys(initialData)) {
      const absolute = _resolve(path);
      _mkdirp(absolute);
      filesystem[absolute] = initialData[path] === null ? null : Buffer.from(initialData[path]);
    }
  };
  init();

  const exists = (path) => (_resolve(path) in filesystem);
  const mkdir = (path) => void(filesystem[_resolve(path)] = null);
  const copyFile = (src, dest) => void(filesystem[_resolve(dest)] = Buffer.from(filesystem[_resolve(src)]));
  const readFile = (path) => Buffer.from(filesystem[_resolve(path)]);
  const writeFile = (path, data) => void(filesystem[_resolve(path)] = Buffer.from(data));
  const readdir = (path) => {
    const absolute = _resolve(path);
    return Object.keys(filesystem)
      .filter((file) => file.startsWith(`${absolute}/`))
      .map((file) => file.substring(absolute.length + 1))
      .filter((file) => !file.includes('/'));
  };

  const fs = {
    existsSync: jest.fn(exists),
    mkdirSync: jest.fn(mkdir),
    mkdir: jest.fn(callbackify(mkdir)),
    copyFileSync: jest.fn(copyFile),
    copyFile: jest.fn(callbackify(copyFile)),
    readFileSync: jest.fn(readFile),
    readFile: jest.fn(callbackify(readFile)),
    writeFileSync: jest.fn(writeFile),
    writeFile: jest.fn(callbackify(writeFile)),
    readdirSync: jest.fn(readdir),
    readdir: jest.fn(callbackify(readdir)),
  };

  const mockClear = () => Object.keys(fs).forEach((method) => fs[method].mockClear());
  const mockReset = () => {
    mockClear();
    init();
  };

  return {
    ...fs,
    filesystem,
    mockClear,
    mockReset,
  };
};
