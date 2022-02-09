const Obj = require('./Obj');

describe('Obj', () => {
  describe('.bindMethods()', () => {
    it('binds all methods of an object so they can be used standalone', () => {
      const obj = {
        foo: 123,
        bar() {
          return this.foo;
        },
      };

      Obj.bindMethods(obj);
      const { foo, bar } = obj;
      expect(foo).toBe(123);
      expect(bar()).toBe(123);
    });

    it('binds all methods of a class instance so they can be used standalone', () => {
      const obj = new class {
        foo = 123;
        bar() {
          return this.foo;
        }
      };

      Obj.bindMethods(obj);
      const { foo, bar } = obj;
      expect(foo).toBe(123);
      expect(bar()).toBe(123);
    });
  });

  describe('.deepCopy()', () => {
    it('copies objects', () => {
      const obj = {
        foo: [123, 456],
        bar: { x: 'abc' },
        baz: true,
      };

      const copy = Obj.deepCopy(obj);
      expect(copy).toHaveProperty('foo', expect.arrayContaining([123, 456]));
      expect(copy).toHaveProperty('bar', expect.objectContaining({ x: 'abc' }));
      expect(copy).toHaveProperty('baz', true);
    });

    it('derefences copied objects', () => {
      const obj = {
        foo: [123, 456],
        bar: { x: 'abc' },
        baz: true,
      };

      const copy = Obj.deepCopy(obj);

      copy.foo.pop();
      delete copy.bar.x;
      copy.baz = false;

      expect(obj).toHaveProperty('foo', expect.arrayContaining([123, 456]));
      expect(obj).toHaveProperty('bar', expect.objectContaining({ x: 'abc' }));
      expect(obj).toHaveProperty('baz', true);
    });
  });
});
