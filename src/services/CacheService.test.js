const Cache = require('./CacheService');

describe('CacheService', () => {
  describe('.get()', () => {
    it('fetches existing values', () => {
      const cache = Cache({ foo: 'bar' });

      const foo = cache.get('foo');
      expect(foo).toBe('bar');
    });

    it('fetches non-existent values', () => {
      const cache = Cache();

      const foo = cache.get('foo');
      expect(foo).toBe(undefined);
    });
  });

  describe('.set()', () => {
    it('sets values', () => {
      const cache = Cache();

      cache.set('foo', 'bar');
      const foo = cache.get('foo');
      expect(foo).toBe('bar');
    });

    it('overwrites values', () => {
      const cache = Cache({ foo: 'bar' });

      cache.set('foo', 'baz');
      const foo = cache.get('foo');
      expect(foo).toBe('baz');
    });
  });

  describe('.remove()', () => {
    it('removes existing values', () => {
      const cache = Cache({ foo: 'bar' });

      cache.remove('foo');
      const foo = cache.get('foo');
      expect(foo).toBe(undefined);
    });

    it('fetches non-existent values', () => {
      const cache = Cache();

      cache.remove('foo');
      const foo = cache.get('foo');
      expect(foo).toBe(undefined);
    });
  });

  describe('.has()', () => {
    it('returns true on existing values', () => {
      const cache = Cache({ foo: 'bar', baz: false });
      expect(cache.has('foo')).toBe(true);
      expect(cache.has('baz')).toBe(true);
    });

    it('eturns false on non-existent values', () => {
      const cache = Cache();
      expect(cache.has('foo')).toBe(false);
    });
  });

  describe('.remember()', () => {
    it('fetches existing values', async () => {
      const cache = Cache({ foo: 'bar' });
      const foo = await cache.remember('foo', 'baz');
      expect(foo).toBe('bar');
    });

    it('sets non-existent values', async () => {
      const cache = Cache();
      const foo = await cache.remember('foo', 'bar');
      expect(foo).toBe('bar');
      expect(cache.get('foo')).toBe('bar');
    });

    it('sets non-existent values with a callback', async () => {
      const cache = Cache();
      const foo = await cache.remember('foo', async () => 'bar');
      expect(foo).toBe('bar');
      expect(cache.get('foo')).toBe('bar');
    });
  });
});
