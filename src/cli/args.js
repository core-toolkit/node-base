const assert = require('assert');
const cp = require('child_process');
const fs = require('fs');
const p = require('path');

const Str = {
  /**
   * @param {String} str
   * @param {String} search
   * @param {Boolean} after
   * @returns {Number}
   */
  indexOf(str, search, after = false) {
    let index = after ? str.lastIndexOf(search) : str.indexOf(search);
    if (after && index > -1) {
      index += search.length;
    }
    return index;
  },

  /**
   * @param {String} str
   * @param {Object.<string, String>} replacements
   * @returns {String}
   */
  replaceTokens(str, replacements) {
    return Object.keys(replacements).reduce((out, key) => {
      return out.replaceAll(`__${key}__`, replacements[key]);
    }, str);
  },

  /**
   * @param {String} str
   * @returns {String[]}
   */
  tokens(str) {
    const matches = [...str.matchAll('__([^_]+)__')];
    return matches.map(([, v]) => v).filter((v, i, a) => a.indexOf(v) === i);
  }
};

const Func = {
  /**
   * @param {Function} func
   * @returns {Function}
   */
  memoize(func) {
    const cache = {};
    return (...args) => {
      const key = JSON.stringify(args);
      if (key in cache) {
        return cache[key];
      }
      return cache[key] = func(...args);
    };
  },
};

const cwd = process.cwd();
const templatesPath = p.resolve(__dirname, 'templates');

/**
 * @param  {...String} path
 * @returns {String}
 */
const resolve = (...path) => p.resolve(cwd, ...path);

/**
 * @param  {...String} path
 * @returns {String}
 */
const resolveTemplate = (...path) => p.resolve(templatesPath, ...path);

/**
 * @param  {String} path
 * @returns {Boolean}
 */
const exists = (path) => fs.existsSync(resolve(path));

/**
 * @param {String} cmd
 * @param  {...String} args
 */
const exec = (cmd, ...args) => cp.spawnSync(cmd, args.slice(1), { stdio: 'inherit' });

/**
 * @param  {String} path
 * @param {String} cmd
 * @param  {...String} args
 */
const execIfNotExists = (path, cmd, ...args) => {
  if (!exists(path)) exec(cmd, ...args);
};

/**
 * @param {String} path
 * @param {Boolean} overwrite
 */
const copy = (path, overwrite = false) => {
  if (overwrite || exists(...path)) {
    fs.copyFileSync(resolveTemplate(path), resolve(path));
  }
};

/**
 * @param {String} path
 * @returns {String}
 */
const read = (path) => fs.readFileSync(resolve(path)).toString();

/**
 * @param {String} path
 * @returns {String}
 */
const readTemplate = Func.memoize((path) => fs.readFileSync(resolveTemplate(path)).toString());

/**
 * @param {String} path
 * @param {String|Buffer} data
 */
const write = (path, data) => fs.writeFileSync(resolve(path), data);

/**
 * @param  {...String} parts
 */
const mkdirp = (...parts) => {
  const expanded = parts.flatMap((part) => part.split('/')).filter((part) => part !== '');

  for (let i = 0; i < expanded.length; ++i) {
    const partialPath = expanded.slice(0, i + 1).join('/');
    if (!exists(partialPath)) fs.mkdirSync(resolve(partialPath));
  }
};

/**
 * @param {String} src
 * @param {Object.<string, String>} replacements
 * @returns {String}
 */
const readTemplateAndReplace = (src, replacements) => {
  const tpl = readTemplate(src);

  const tokens = Str.tokens(tpl);
  for (const token of tokens) {
    assert(token in replacements, `Replacement parameter '${token}' required by template '${src}' missing`);
  }

  return Str.replaceTokens(tpl, replacements);
};

/**
 * @param {String} src
 * @param {String} dst
 * @param {String} name
 * @param {Object.<string, String>} replacements
 */
const template = (src, dst, replacements = {}) => {
  const processed = readTemplateAndReplace(src, replacements);

  write(dst, processed);
};

/**
 * @param {String} src
 * @param {String} dst
 * @param {String} search
 * @param {Boolean} before
 * @param {Object.<string, String>} replacements
 */
const partial = (src, dst, search, before = false, replacements = {}) => {
  const input = read(dst);
  const index = Str.indexOf(input, search, !before);
  if (index === -1) {
    throw new Error(`Cannot find delimiter "${search}" in template "${src}"`);
  }

  const processed = readTemplateAndReplace(src, replacements);
  const out = input.substring(0, index) + processed + input.substring(index);

  write(dst, out);
};

/**
 * @param {Object|undefined} replacement
 * @returns {Object|undefined}
 */
const packageJSON = (replacement = undefined) => {
  if (replacement) {
    return write('package.json', JSON.stringify(replacement, undefined, 2));
  }
  return JSON.parse(read('package.json'));
};

const componentOrder = ['Routes', 'Controller', 'UseCase', 'Service', 'Client', 'Model'];
/**
 * @param {String} type
 * @param {String} name
 * @param {String} path
 */
const addToRoot = (type, name, path) => {
  const startFrom = componentOrder.indexOf(type);
  assert(startFrom !== -1, `Unknown type '${type}'`);

  const varName = `${name}${type}`;
  const args = type === 'Routes' ? varName : `'${varName}', ${varName}`;

  const reqStr = readTemplateAndReplace('src/root-require.js.partial', { varName, path });
  const regStr = readTemplateAndReplace('src/root-register.js.partial', { type, args });

  const root = read('src/root.js');

  const order = componentOrder.slice(startFrom).map((v) => `${v}');\n`);

  let reqPadding = '';
  let regPadding = '';

  let reqIndex = order.concat("('node-base');\n").reduce((index, v, i) => {
    if (index !== -1) return index;
    if (i) reqPadding = '\n';
    return Str.indexOf(root, v, true);
  }, -1);
  let regIndex = order.concat('Config);\n').reduce((index, v, i) => {
    if (index !== -1) return index;
    if (i) regPadding = '\n';
    return Str.indexOf(root, v, true);
  }, -1);


  const newRoot = root.substring(0, reqIndex) +
    reqPadding + reqStr + root.substring(reqIndex, regIndex) +
    regPadding + regStr + root.substring(regIndex);

  write('src/root.js', newRoot);
};

module.exports = {
  resolve,
  exists,
  read,
  write,
  exec,
  execIfNotExists,
  copy,
  packageJSON,
  mkdirp,
  addToRoot,
  partial,
  template,
};
