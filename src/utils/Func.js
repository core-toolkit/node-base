/**
 * @param {Function} func
 * @returns {Function}
 */
exports.memoize = (func) => {
  const cache = {};
  return (...args) => {
    const key = JSON.stringify(args);
    if (key in cache) {
      return cache[key];
    }
    return cache[key] = func(...args);
  };
};

/**
 * @typedef {(error: any|null, result: any|null) => void} CallbackFn
 *
 * @param {Function} fn
 * @returns {(...args: any, callback: CallbackFn) => Promise<void>}
 */
exports.callbackify = (fn) => async (...args) => {
  const callback = args.pop();
  let result = undefined;
  try {
    result = await fn(...args);
  } catch (e) {
    callback(e);
    return;
  }
  callback(undefined, result);
};
