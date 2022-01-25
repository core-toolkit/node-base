module.exports = (initialState = {}) => {
  const store = Object.assign({}, initialState);

  const iface = {
    get(key) {
      return store[key];
    },
    set(key, value) {
      store[key] = value;
    },
    remember(key, defaultValue) {
      if (iface.has(key)) {
        return iface.get(key);
      }

      if (typeof defaultValue !== 'function') {
        iface.set(key, defaultValue);
        return defaultValue;
      }

      return new Promise(async (res) => {
        const value = await defaultValue();
        this.set(key, value);
        res(value);
      });
    },
    remove(key) {
      delete store[key];
    },
    has(key) {
      return key in store;
    },
  };

  return iface;
};
