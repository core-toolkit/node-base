const Mock = require('./Mock');

describe('Mock', () => {
  describe('.deepMockClear()', () => {
    it('recursively clears all mocks within the supplied object', () => {
      const obj = {
        foo: { fooo: jest.fn() },
        bar: [jest.fn()],
        baz: 'qux',
        quux: () => {},
      };
      obj.foo.fooo();
      obj.bar[0]();

      Mock.deepMockClear(obj);
      expect(obj.foo.fooo).not.toHaveBeenCalled();
      expect(obj.bar[0]).not.toHaveBeenCalled();
    });
  });
});
