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
    it('copies primitives', () => {
      expect(Obj.deepCopy('foo')).toBe('foo');
      expect(Obj.deepCopy(5)).toBe(5);
      expect(Obj.deepCopy(null)).toBe(null);
      expect(Obj.deepCopy(undefined)).toBe(undefined);
      expect(Obj.deepCopy(false)).toBe(false);
    });

    it('copies arrays', () => {
      const src = [1, 2, 3];
      const copy = Obj.deepCopy(src);
      expect(copy).toEqual(src);
      expect(copy).not.toBe(src);
    });

    it('copies objects', () => {
      const src = { foo: 'bar', baz: 'qux' };
      const copy = Obj.deepCopy(src);
      expect(copy).toEqual(src);
      expect(copy).not.toBe(src);
    });

    it('copies deeply-nested structures', () => {
      const src = { foo: { bar: [ { baz: 'test' }] }, qux: [1, 2, 3] };
      const copy = Obj.deepCopy(src);
      expect(copy).toEqual(src);
      expect(copy).not.toBe(src);

      copy.foo.bar[0].baz = 'changed';
      expect(src.foo.bar[0].baz).toBe('test');
    });

    it('copies safe instances', () => {
      const Foo = class { constructor(bar) { this.bar = bar; } };
      const src = [ new Date(), new Set(['a', 'b', 'c']), Buffer.from([1, 2, 3]), new Foo('qux') ];
      const copy = Obj.deepCopy(src);
      expect(copy).toEqual(src);
      expect(copy).not.toBe(src);

      expect(copy[3]).not.toBeInstanceOf(Foo);
      expect(copy[3].bar).toBe('qux');

      copy[3].bar = 'quux';
      expect(src[3].bar).toBe('qux');
    });

    it('copies unsafe instances', () => {
      const Foo = class { constructor(bar) { this.bar = bar?.bar ?? bar; } };

      const src = { baz: new Foo('qux') };
      const copy = Obj.deepCopy(src, true);
      expect(copy).toEqual(src);
      expect(copy).not.toBe(src);

      expect(copy.baz).toBeInstanceOf(Foo);
      expect(copy.baz.bar).toBe('qux');

      copy.baz.bar = 'quux';
      expect(src.baz.bar).toBe('qux');
    });
  });

  describe('.deepEquals()', () => {
    it('compares primitives', () => {
      expect(Obj.deepEquals('foo', 'foo')).toBe(true);
      expect(Obj.deepEquals('foo', 'bar')).toBe(false);
      expect(Obj.deepEquals(5, 5)).toBe(true);
      expect(Obj.deepEquals(5, 6)).toBe(false);
      expect(Obj.deepEquals(null, null)).toBe(true);
      expect(Obj.deepEquals(undefined, undefined)).toBe(true);
      expect(Obj.deepEquals(false, false)).toBe(true);
      expect(Obj.deepEquals(true, false)).toBe(false);
    });

    it('compares arrays', () => {
      const src = [1, 2, 3];
      expect(Obj.deepEquals([], [])).toBe(true);
      expect(Obj.deepEquals(src, [1, 2, 3])).toBe(true);
      expect(Obj.deepEquals(src, [1, 2, 3, 4])).toBe(false);
      expect(Obj.deepEquals(src, [1, 2])).toBe(false);
      expect(Obj.deepEquals(src, [1, 3, 2])).toBe(false);
    });

    it('compares objects', () => {
      const Foo = class { bar = 'baz'; };
      const src = { foo: 'bar', baz: 'qux' };

      expect(Obj.deepEquals({}, {})).toBe(true);
      expect(Obj.deepEquals(src, { foo: 'bar', baz: 'qux' })).toBe(true);
      expect(Obj.deepEquals(src, { foo: 'bar', baz: 'qux', quux: 123 })).toBe(false);
      expect(Obj.deepEquals(src, { foo: 'bar' })).toBe(false);
      expect(Obj.deepEquals(new Foo(), new Foo())).toBe(false);
    });

    it('compares deeply-nested structures', () => {
      const src = { foo: { bar: [ { baz: 'test' }] }, qux: [1, 2, 3] };
      const equals = Obj.deepEquals(src, { foo: { bar: [ { baz: 'test' }] }, qux: [1, 2, 3] });
      expect(equals).toBe(true);
    });

    it('compares references', () => {
      const src = [ new Date(), new Set(['foo']), Buffer.from([1, 2, 3]), { foo: 'bar' } ];
      expect(Obj.deepEquals(src, src)).toBe(true);
      expect(Obj.deepEquals(src[0], src[0])).toBe(true);
      expect(Obj.deepEquals(src[1], src[1])).toBe(true);
      expect(Obj.deepEquals(src[2], src[2])).toBe(true);
      expect(Obj.deepEquals(src[3], src[3])).toBe(true);
    });

    it('compares instances of built-ins', () => {
      expect(Obj.deepEquals(new Int8Array([1, 2]), new Int8Array([1, 2]))).toBe(true);
      expect(Obj.deepEquals(new Int8Array([1, 2]), new Int8Array([1, 2, 3]))).toBe(false);
      expect(Obj.deepEquals(new Set([1, 2]), new Set([1, 2]))).toBe(true);
      expect(Obj.deepEquals(new Set([1, 2]), new Set([1, 2, 2]))).toBe(true);
      expect(Obj.deepEquals(new Set([1, 2]), new Set([1, 2, 3]))).toBe(false);
      expect(Obj.deepEquals(new Map([[1, 2], [2, 3]]), new Map([[1, 2], [2, 3]]))).toBe(true);
      expect(Obj.deepEquals(new Map([[1, 2], [2, 3]]), new Map([[1, 2], [2, 3], [3, 4]]))).toBe(false);
      expect(Obj.deepEquals(new RegExp(/bla/g), /bla/g)).toBe(true);
      expect(Obj.deepEquals(new String('asd'), new String('asd'))).toBe(true);
      expect(Obj.deepEquals('qwe', new String('qwe'))).toBe(true);
      expect(Obj.deepEquals(new Number(5), 5)).toBe(true);
      expect(Obj.deepEquals(true, new Boolean(5))).toBe(true);
    });

    it('compares items of different types', () => {
      expect(Obj.deepEquals(null, undefined)).toBe(false);
      expect(Obj.deepEquals([], {})).toBe(false);
      expect(Obj.deepEquals({}, null)).toBe(false);
      expect(Obj.deepEquals(new Date(), new Set())).toBe(false);
      expect(Obj.deepEquals(new Int8Array([1, 2]), new Int16Array([1, 2]))).toBe(false);
    });
  });
});
