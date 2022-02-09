/**
 * @param {Object.<string, Function>} obj
 */
const bindMethods = (obj) => {
  const prototype = obj.constructor === Object ? obj : Object.getPrototypeOf(obj);
  Object.getOwnPropertyNames(prototype)
    .filter(prop => typeof obj[prop] === 'function' && prop !== 'constructor')
    .forEach(method => (obj[method] = obj[method].bind(obj)));
};

/**
 * @param {Object<T>}
 * @returns {Object<T>}
 */
const deepCopy = (obj) => {
  if (Array.isArray(obj)) return obj.map(deepCopy);
  if (obj && typeof obj === 'object') return Object.keys(obj).reduce((o, k) => (o[k] = deepCopy(obj[k]), o), {});
  return obj;
};

module.exports = {
  bindMethods,
  deepCopy,
};
