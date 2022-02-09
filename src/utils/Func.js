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
