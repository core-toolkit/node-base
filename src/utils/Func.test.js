const Func = require('./Func');

describe('Func', () => {
  describe('.memoize()', () => {
    it('returns a function that works exactly as the target function', () => {
      const mock = jest.fn((x) => x);
      const fn = Func.memoize(mock);

      expect(fn(1)).toBe(1);
      expect(mock).toHaveBeenLastCalledWith(1);

      expect(fn('foo')).toBe('foo');
      expect(mock).toHaveBeenLastCalledWith('foo');
    });

    it('caches the return value for calls with the same parameters', () => {
      const mock = jest.fn((x) => x);
      const fn = Func.memoize(mock);

      expect(fn(1)).toBe(1);
      expect(fn(1)).toBe(1);
      expect(mock).toHaveBeenCalledWith(1);
      expect(mock).toHaveBeenCalledTimes(1);

      expect(fn('foo')).toBe('foo');
      expect(fn('foo')).toBe('foo');
      expect(fn(1)).toBe(1);
      expect(mock).toHaveBeenCalledWith('foo');
      expect(mock).toHaveBeenCalledTimes(2);
    });
  });
});
