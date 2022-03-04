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

  describe('.callbackify()', () => {
    it('calbackifies the supplied async function and produces results', (done) => {
      const mockFn = jest.fn(async () => 'foo');
      const callbackified = Func.callbackify(mockFn);

      const mockCallback = jest.fn((error, result) => {
        expect(error).toBe(undefined);
        expect(result).toBe('foo');
        expect(mockFn).toHaveBeenCalledWith('bar', 'baz');
        done();
      });
      callbackified('bar', 'baz', mockCallback);
    });

    it('calbackifies the supplied async function and produces errors', (done) => {
      const mockFn = jest.fn().mockRejectedValue(new Error('foo'));
      const callbackified = Func.callbackify(mockFn);

      const mockCallback = jest.fn((error) => {
        expect(error).toEqual(new Error('foo'));
        expect(mockFn).toHaveBeenCalled();
        done();
      });
      callbackified(mockCallback);
    });
  });
});
