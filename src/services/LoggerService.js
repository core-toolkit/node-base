let padding = 0;
const Logger = {
  l: (prefix, ...args) => console.log(`[DEBUG] [${prefix.padEnd(padding)}]`, ...args),
  i: (prefix, ...args) => console.info(`[INFO ] [${prefix.padEnd(padding)}]`, ...args),
  e: (prefix, ...args) => console.error(`[ERROR] [${prefix.padEnd(padding)}]`, ...args),
  d: (...args) => Logger.l(...args),
  log: (...args) => Logger.l(...args),
  info: (...args) => Logger.i(...args),
  error: (...args) => Logger.e(...args),
  debug: (...args) => Logger.l(...args),
};

module.exports = new Proxy({}, {
  get(_, name) {
    if (name.length > padding) {
      padding = name.length;
    }
    return new Proxy({}, {
      get(_, method) {
        return (...args) => Logger[method](name, ...args);
      },
      set() { },
    });
  },
  set() { },
});
