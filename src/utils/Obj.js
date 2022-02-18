/**
 * @param {Object.<string, Function>} obj
 */
const bindMethods = (obj) => {
  const prototype = obj.constructor === Object ? obj : Object.getPrototypeOf(obj);
  Object.getOwnPropertyNames(prototype)
    .filter(prop => typeof obj[prop] === 'function' && prop !== 'constructor')
    .forEach(method => (obj[method] = obj[method].bind(obj)));
};

const primitivable = [Boolean, Number];
const stringable = [String, Date, RegExp];
const arrayable = [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array, Map, Set]
const safelyConstructable = primitivable.concat(stringable, arrayable);

const is = (obj, constructors) => constructors.some((Type) => obj instanceof Type);
const reconstruct = (obj) => new obj.constructor(obj);
const toPrimitive = (obj) => obj.constructor(obj);
/**
 * @param {Object<T>} obj
 * @param {Boolean} unsafe
 * @returns {Object<T>}
 */
const deepCopy = (obj, unsafe = false) => {
  if (Array.isArray(obj)) return obj.map((e) => deepCopy(e, unsafe));
  if (typeof obj !== 'object' || !obj) return obj;

  if (obj instanceof Buffer) return Buffer.from(obj);
  const safe = is(obj, safelyConstructable);
  if ((safe || unsafe) && Object.getPrototypeOf(obj) !== Object.prototype) return reconstruct(obj);

  const newObj = {};
  for (const key of Object.keys(obj)) {
    newObj[key] = deepCopy(obj[key], unsafe)
  }
  return newObj;
};

const deepEquals = (obj1, obj2) => {
  if (is(obj1, primitivable)) {
    obj1 = toPrimitive(obj1);
  } else if (is(obj1, stringable)) {
    obj1 = String(obj1);
  }

  if (is(obj2, primitivable)) {
    obj2 = toPrimitive(obj2);
  } else if (is(obj2, stringable)) {
    obj2 = String(obj2);
  }

  if (obj1 === obj2) return true;

  const type = typeof obj1;
  if (type !== 'object' || type !== typeof obj2 || obj1 === null || obj2 === null) return false;
  if (obj1.constructor !== obj2.constructor) return false;

  const isArr = Array.isArray(obj1);
  if (isArr) return obj1.length === obj2.length && obj1.every((el, i) => deepEquals(el, obj2[i]));


  if (is(obj1, arrayable)) {
    return deepEquals([...obj1], [...obj2]);
  }

  if ([obj1, obj2].some((obj) => Object.getPrototypeOf(obj) !== Object.prototype)) return false;

  const keys = Object.keys(obj1);
  if (!deepEquals(keys, Object.keys(obj2))) return false;

  return keys.every((key) => deepEquals(obj1[key], obj2[key]));
};

module.exports = {
  bindMethods,
  deepCopy,
  deepEquals,
};
