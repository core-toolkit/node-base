/**
 * @typedef {(...args: any) => void} LoggerMethod
 *
 * @typedef Console
 * @property {LoggerMethod} log
 * @property {LoggerMethod} info
 * @property {LoggerMethod} error
 *
 * @typedef Logger
 * @property {LoggerMethod} l
 * @property {LoggerMethod} i
 * @property {LoggerMethod} e
 * @property {LoggerMethod} d
 * @property {LoggerMethod} log
 * @property {LoggerMethod} info
 * @property {LoggerMethod} error
 * @property {LoggerMethod} debug
 */
const Logger = {
  l: (console, padding, prefix, ...args) => console.log(`[DEBUG] [${prefix.padEnd(padding)}]`, ...args),
  i: (console, padding, prefix, ...args) => console.info(`[INFO ] [${prefix.padEnd(padding)}]`, ...args),
  e: (console, padding, prefix, ...args) => console.error(`[ERROR] [${prefix.padEnd(padding)}]`, ...args),
  d: (...args) => Logger.l(...args),
  log: (...args) => Logger.l(...args),
  info: (...args) => Logger.i(...args),
  error: (...args) => Logger.e(...args),
  debug: (...args) => Logger.l(...args),
};

/**
 * @param {Console} console
 * @returns {Object.<string, Logger>}
 */
module.exports = (console) => {
  let padding = 0;

  return new Proxy({}, {
    get(_, name) {
      if (name.length > padding) {
        padding = name.length;
      }
      return new Proxy({}, {
        get(_, method) {
          return (...args) => Logger[method](console, padding, name, ...args);
        },
        set() { },
      });
    },
    set() { },
  });
};
