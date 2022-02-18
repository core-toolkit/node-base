const deepMockClear = (obj) => {
  if (typeof obj === 'function') {
    obj.mockClear?.();
  } else if (Array.isArray(obj)) {
    obj.forEach(deepMockClear);
  } else if (obj !== null && typeof obj === 'object') {
    Object.keys(obj).forEach((key) => deepMockClear(obj[key]));
  }
};

module.exports = {
  deepMockClear,
};
