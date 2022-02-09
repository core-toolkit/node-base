const __name__Service = require('./__name__Service');

describe('__name__Service', () => {
  const context = { Core: { Config: { __name__: { allowed: [1, 2] } } } };
  const service = __name__Service(context);

  describe('.isAllowed()', () => {
    it('returns true on allowed codes', () => {
      expect(service.isAllowed(1)).toBe(true);
      expect(service.isAllowed(2)).toBe(true);
    });

    it('returns false on codes which are not allowed', () => {
      expect(service.isAllowed(3)).toBe(false);
      expect(service.isAllowed(-1)).toBe(false);
      expect(service.isAllowed('foo')).toBe(false);
    });
  });

  describe('.isValid()', () => {
    it('returns true on valid codes', () => {
      expect(service.isValid(1)).toBe(true);
      expect(service.isValid(2)).toBe(true);
      expect(service.isValid(3)).toBe(true);
    });

    it('returns false on invalid codes', () => {
      expect(service.isValid(-1)).toBe(false);
      expect(service.isValid('foo')).toBe(false);
    });
  });

  describe('.assert()', () => {
    it('passes on valid codes', () => {
      service.assert(1);
      service.assert(2);
    });

    it('throws on invalid codes', () => {
      expect(() => service.assert(-1)).toThrow();
      expect(() => service.assert('foo')).toThrow();
    });

    it('throws on codes which are not allowed', () => {
      expect(() => service.assert(3)).toThrow();
    });
  });
});
