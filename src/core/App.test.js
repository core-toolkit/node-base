const MakeApp = require('./App');

describe('Application', () => {
  describe('.resolveDependencies()', () => {
    it('resolves the requested type dependencies', async () => {
      const app = MakeApp();

      app.registerType('TestType1');
      app.registerType('TestType2');
      app.registerType('TestType3');

      app.register('TestType1', 'Test1', () => 'foo');
      app.register('TestType2', 'Test2', () => 'bar');

      const resolved = await app.resolveDependencies(['TestType1', 'TestType2']);
      expect(resolved).toHaveProperty('TestType1.Test1');
      expect(resolved).toHaveProperty('TestType2.Test2');
      expect(resolved).not.toHaveProperty('TestType3');

      expect(resolved.TestType1.Test1).toBe('foo');
      expect(resolved.TestType2.Test2).toBe('bar');
    });
  });

  describe('.registerType()', () => {
    it('registers types', async () => {
      const app = MakeApp();
      app.registerType('TestType1');
      app.registerType('TestType2', 'TestType1');

      const mock = jest.fn();
      app.register('TestType2', 'Test', mock);
      await app.start();

      expect(mock).toHaveBeenCalledWith(expect.objectContaining({ TestType1: expect.any(Object) }));
    });

    it('does not register duplicate types', () => {
      const app = MakeApp();
      app.registerType('TestType');
      expect(() => app.registerType('TestType')).toThrow();
    });
  });

  describe('.addMiddleware()', () => {
    it('registers custom registration handler middleware', async () => {
      const app = MakeApp();
      app.registerType('TestType1');
      app.registerType('TestType2', 'TestType1');
      app.registerType('TestType3', 'TestType2');

      app.addMiddleware((makeFn, context, type) => {
        if (type === 'TestType2') return () => makeFn(context.TestType1);
        return makeFn;
      });
      app.addMiddleware((makeFn, context, type, name) => {
        if (type === 'TestType2') return { ...makeFn(), extra: name };
        return makeFn(context, 'foo');
      });

      const Test1 = jest.fn(() => 'bar');
      const Test2 = jest.fn(() => ({ qux: 123 }));
      const Test3 = jest.fn();

      app.register('TestType1', 'Test1', Test1);
      app.register('TestType2', 'Test2', Test2);
      app.register('TestType3', 'Test3', Test3);
      await app.start();

      expect(Test1).toHaveBeenCalledWith(expect.any(Object), 'foo');
      expect(Test2).toHaveBeenCalledWith(expect.objectContaining({ Test1: 'bar' }));
      expect(Test3).toHaveBeenCalledWith(
        expect.objectContaining({
          TestType2: {
            Test2: { qux: 123, extra: 'Test2' },
          },
        }),
        'foo',
      );
    });

    it('does not register invalid middleware', async () => {
      const app = MakeApp();
      app.registerType('TestType1');
      app.registerType('TestType2', 'TestType1');

      expect(() => app.addMiddleware('TestType', 123)).toThrow();

      const Test1 = 'foo';
      const Test2 = jest.fn();

      app.register('TestType1', 'Test1', () => Test1);
      app.register('TestType2', 'Test2', Test2);
      await app.start();

      expect(Test2).toHaveBeenCalledWith(expect.objectContaining({
        TestType1: expect.objectContaining({ Test1 }),
      }));
    });
  });

  describe('.appendTypeParameters()', () => {
    it('registers additional parameters for existing types', async () => {
      const app = MakeApp();
      app.registerType('TestType1');
      app.registerType('TestType2');
      app.appendTypeParameters('TestType2', 'TestType1');

      const Test1 = jest.fn();
      const Test2 = jest.fn();
      app.register('TestType1', 'Test1', Test1);
      app.register('TestType2', 'Test2', Test2);
      await app.start();

      expect(Test1).not.toHaveBeenCalledWith(expect.objectContaining({ TestType1: expect.any(Object) }));
      expect(Test2).toHaveBeenCalledWith(expect.objectContaining({ TestType1: expect.any(Object) }));
    });

    it('does not allow registering parameters for unknown types', () => {
      const app = MakeApp();
      expect(() => app.appendTypeParameters('TestType', 'Core')).toThrow();
    });

    it('does not allow registering parameters of unknown types', () => {
      const app = MakeApp();
      app.registerType('TestType1');
      expect(() => app.appendTypeParameters('TestType1', 'TestType2')).toThrow();
    });

    it('does not allow registering non-string parameters', () => {
      const app = MakeApp();
      app.registerType('TestType');
      expect(() => app.appendTypeParameters('TestType', 123)).toThrow();
    });

    it('does not allow registering cyclical dependencies', () => {
      const app = MakeApp();
      app.registerType('TestType1');
      app.registerType('TestType2', 'TestType1', 'TestType2');
      expect(() => app.appendTypeParameters('TestType1', 'TestType2')).toThrow();
    });
  });

  describe('.addTypeMiddleware()', () => {
    it('registers custom registration handler middleware', async () => {
      const app = MakeApp();
      app.registerType('TestType1');
      app.registerType('TestType2', 'TestType1');
      app.registerType('TestType3', 'TestType2');

      app.addTypeMiddleware('TestType2', (makeFn, { TestType1 }) => () => makeFn(TestType1.Test1));
      app.addTypeMiddleware('TestType2', (makeFn, { TestType1 }) => async () => makeFn() + TestType1.Test1.foo);

      const Test1 = { foo: 10 };
      const Test2 = jest.fn(({ foo }) => foo);
      const Test3 = jest.fn();

      app.register('TestType1', 'Test1', () => Test1);
      app.register('TestType2', 'Test2', Test2);
      app.register('TestType3', 'Test3', Test3);
      await app.start();

      expect(Test2).toHaveBeenCalledWith(Test1);
      expect(Test3).toHaveBeenCalledWith(expect.objectContaining({ TestType2: { Test2: 20 }}));
    });

    it('does not register invalid middleware', async () => {
      const app = MakeApp();
      app.registerType('TestType1');
      app.registerType('TestType2', 'TestType1');

      expect(() => app.addTypeMiddleware('TestType', 123)).toThrow();

      const Test1 = 'foo';
      const Test2 = jest.fn();

      app.register('TestType1', 'Test1', () => Test1);
      app.register('TestType2', 'Test2', Test2);
      await app.start();

      expect(Test2).toHaveBeenCalledWith(expect.objectContaining({
        TestType1: expect.objectContaining({ Test1 }),
      }));
    });

    it('does not register middleware for unknown types', () => {
      const app = MakeApp();
      expect(() => app.addTypeMiddleware('TestType', () => {})).toThrow();
    });
  });

  describe('.afterInit()', () => {
    it('registers a callback to be executed for the "afterInit" hook', () => {
      const app = MakeApp();
      app.afterInit(() => {});
    });

    it('does not register invalid callbacks', () => {
      const app = MakeApp();
      expect(() => app.afterInit('foo')).toThrow();
    });
  });

  describe('.afterStart()', () => {
    it('registers a callback to be executed for the "afterStart" hook', () => {
      const app = MakeApp();
      app.afterStart(() => {});
    });

    it('does not register invalid callbacks', () => {
      const app = MakeApp();
      expect(() => app.afterStart('foo')).toThrow();
    });
  });

  describe('.beforeStop()', () => {
    it('registers a callback to be executed for the "beforeStop" hook', () => {
      const app = MakeApp();
      app.beforeStop(() => {});
    });

    it('does not register invalid callbacks', () => {
      const app = MakeApp();
      expect(() => app.beforeStop('foo')).toThrow();
    });
  });

  describe('.initAll()', () => {
    it('waits for all registered components to initialize', async () => {
      const app = MakeApp();
      const Test1 = jest.fn().mockReturnValue('foo');
      const Test2 = jest.fn().mockReturnValue('bar');
      const Test3 = jest.fn().mockReturnValue('baz');

      app.registerType('TestType1');
      app.registerType('TestType2', 'TestType1', 'TestType2');
      app.register('TestType1', 'Test1', Test1);
      app.register('TestType2', 'Test2', Test2);
      app.register('TestType2', 'Test3', Test3);
      const components = await app.initAll();
      expect(Test1).toHaveBeenCalledTimes(1);
      expect(Test1).toHaveBeenCalledWith({});
      expect(Test2).toHaveBeenCalledTimes(1);
      expect(Test2).toHaveBeenCalledWith({ TestType1: { Test1: 'foo' }, TestType2: {} });
      expect(Test3).toHaveBeenCalledTimes(1);
      expect(Test3).toHaveBeenCalledWith({ TestType1: { Test1: 'foo' }, TestType2: { Test2: 'bar' } });
      expect(components).toEqual({
        TestType1: { Test1: 'foo' },
        TestType2: { Test2: 'bar', Test3: 'baz' },
      })
    });

    it('calls all callbacks after it has executed', async () => {
      const app = MakeApp();
      app.registerType('Type1');
      app.registerType('Type2');
      app.register('Type1', 'Test1', () => 'foo');
      app.register('Type2', 'Test2', () => 'bar');

      const orderMock = jest.fn();
      const mock1 = jest.fn(() => orderMock(1));
      const mock2 = jest.fn(() => orderMock(2));

      app.afterInit(mock1);
      app.afterInit(mock2);

      await app.initAll();
      expect(mock1).toHaveBeenCalledTimes(1);
      expect(mock1).toHaveBeenCalledWith({ Type1: { Test1: 'foo' }, Type2: { Test2: 'bar' } });
      expect(mock2).toHaveBeenCalledTimes(1);
      expect(mock1).toHaveBeenCalledWith({ Type1: { Test1: 'foo' }, Type2: { Test2: 'bar' } });
      expect(orderMock).toHaveBeenLastCalledWith(2);

      app.registerType('Type3');
      app.register('Type3', 'Test3', () => 'baz');

      orderMock.mockClear();
      mock1.mockClear();
      mock2.mockClear();

      await app.initAll();
      expect(mock1).toHaveBeenCalledTimes(1);
      expect(mock1).toHaveBeenCalledWith({ Type1: { Test1: 'foo' }, Type2: { Test2: 'bar' }, Type3: { Test3: 'baz' } });
      expect(mock2).toHaveBeenCalledTimes(1);
      expect(mock1).toHaveBeenCalledWith({ Type1: { Test1: 'foo' }, Type2: { Test2: 'bar' }, Type3: { Test3: 'baz' } });
      expect(orderMock).toHaveBeenLastCalledWith(2);
    });
  });

  describe('.start()', () => {
    it('starts the application', async () => {
      const app = MakeApp();
      await app.start();
    });

    it('calls all callbacks after it has executed', async () => {
      const app = MakeApp();
      app.registerType('Type1');
      app.registerType('Type2');
      app.register('Type1', 'Test1', () => 'foo');
      app.register('Type2', 'Test2', () => 'bar');

      const orderMock = jest.fn();
      const mock1 = jest.fn(() => orderMock(1));
      const mock2 = jest.fn(() => orderMock(2));

      app.afterStart(mock1);
      app.afterStart(mock2);

      await app.initAll();
      expect(mock1).not.toHaveBeenCalled();
      expect(mock2).not.toHaveBeenCalled();
      expect(orderMock).not.toHaveBeenCalled();

      await app.start();
      expect(mock1).toHaveBeenCalledTimes(1);
      expect(mock1).toHaveBeenCalledWith({ Type1: { Test1: 'foo' }, Type2: { Test2: 'bar' } });
      expect(mock2).toHaveBeenCalledTimes(1);
      expect(mock1).toHaveBeenCalledWith({ Type1: { Test1: 'foo' }, Type2: { Test2: 'bar' } });
      expect(orderMock).toHaveBeenLastCalledWith(2);
    });

    it('does not start the application if already running', async () => {
      const app = MakeApp();
      await app.start();
      await expect(app.start()).rejects.toThrow();
    });
  });

  describe('.stop()', () => {
    it('stops the application', async () => {
      const app = MakeApp();
      await app.start();
      await app.stop();
    });

    it('forces reinitialization of the components on consequent App.start() calls', async () => {
      const app = MakeApp();
      app.registerType('TestType1');
      app.registerType('TestType2', 'TestType1');

      let counter = 0;
      const test1Mock = jest.fn(() => ++counter);
      const test2Mock = jest.fn();

      app.register('TestType1', 'Test1', test1Mock);
      app.register('TestType2', 'Test2', test2Mock);

      await app.start();
      expect(test1Mock).toHaveBeenCalledTimes(1);
      expect(test2Mock).toHaveBeenCalledTimes(1);
      expect(test2Mock).toHaveBeenCalledWith({ TestType1: { Test1: 1 } });

      await app.stop();
      await app.start();
      expect(test1Mock).toHaveBeenCalledTimes(2);
      expect(test2Mock).toHaveBeenCalledTimes(2);
      expect(test2Mock).toHaveBeenLastCalledWith({ TestType1: { Test1: 2 } });
    });

    it('calls all callbacks before it has executed', async () => {
      const app = MakeApp();
      app.registerType('Type1');
      app.registerType('Type2');
      app.register('Type1', 'Test1', () => 'foo');
      app.register('Type2', 'Test2', () => 'bar');

      const orderMock = jest.fn();
      const mock1 = jest.fn(() => orderMock(1));
      const mock2 = jest.fn(() => orderMock(2));

      app.beforeStop(mock1);
      app.beforeStop(mock2);

      await app.start();
      expect(mock1).not.toHaveBeenCalled();
      expect(mock2).not.toHaveBeenCalled();
      expect(orderMock).not.toHaveBeenCalled();

      await app.stop();
      expect(mock1).toHaveBeenCalledTimes(1);
      expect(mock1).toHaveBeenCalledWith({ Type1: { Test1: 'foo' }, Type2: { Test2: 'bar' } });
      expect(mock2).toHaveBeenCalledTimes(1);
      expect(mock1).toHaveBeenCalledWith({ Type1: { Test1: 'foo' }, Type2: { Test2: 'bar' } });
      expect(orderMock).toHaveBeenLastCalledWith(1);
    });

    it('does not stop the application if not running', async () => {
      const app = MakeApp();
      await expect(app.stop()).rejects.toThrow();
    });
  });

  describe('.getTypes()', () => {
    it('returns all registered types in order of dependency', () => {
      const app = MakeApp();
      app.registerType('Foo', 'Foo');
      app.registerType('Bar');
      app.registerType('Baz');
      app.appendTypeParameters('Bar', 'Foo');
      app.registerType('Qux');
      app.registerType('Quux', 'Bar');

      const types = app.getTypes();
      expect(types).toEqual(['Baz', 'Foo', 'Qux', 'Bar', 'Quux']);
    });
  });

  describe('.register()', () => {
    it('registers components', async () => {
      const app = MakeApp();
      const Test1 = jest.fn().mockReturnValue('foo');
      const Test2 = jest.fn();

      app.registerType('TestType1');
      app.registerType('TestType2', 'TestType1');
      app.register('TestType1', 'Test1', Test1);
      app.register('TestType2', 'Test2', Test2);
      await app.start();
      expect(Test1).toHaveBeenCalledTimes(1);
      expect(Test2).toHaveBeenCalledWith(expect.any(Object));
      expect(Test2).toHaveBeenCalledTimes(1);
      expect(Test2).toHaveBeenCalledWith(expect.objectContaining({
        TestType1: expect.objectContaining({ Test1: 'foo' }),
      }));
    });

    it('registers asynchronous components', async () => {
      const app = MakeApp();
      const Test1 = 'foo';
      const Test2 = jest.fn();

      app.registerType('TestType1');
      app.registerType('TestType2', 'TestType1');
      app.register('TestType1', 'Test1', async () => Test1);
      app.register('TestType2', 'Test2', Test2);
      await app.start();
      expect(Test2).toHaveBeenCalledTimes(1);
      expect(Test2).toHaveBeenCalledWith(expect.objectContaining({
        TestType1: expect.objectContaining({ Test1 }),
      }));
    });

    it('registers plain object components', async () => {
      const app = MakeApp();
      const Test1 = { foo: 'bar' };
      const Test2 = jest.fn();

      app.registerType('TestType1');
      app.registerType('TestType2', 'TestType1');
      app.register('TestType1', 'Test1', Test1);
      app.register('TestType2', 'Test2', Test2);
      await app.start();
      expect(Test2).toHaveBeenCalledTimes(1);
      expect(Test2).toHaveBeenCalledWith(expect.objectContaining({
        TestType1: expect.objectContaining({ Test1 }),
      }));
    });

    it('does not allow registering components with the same name', async () => {
      const app = MakeApp();
      const mock = jest.fn();
      app.registerType('TestType');
      app.register('TestType', 'Test', mock);
      expect(() => app.register('TestType', 'Test', mock)).toThrow();

      await app.start();
      expect(mock).toHaveBeenCalledTimes(1);
    });

    it('does not allow registering components with an unknown type', async () => {
      const app = MakeApp();
      const mock = jest.fn();
      expect(() => app.register('TestType', 'Test', mock)).toThrow();

      await app.start();
      expect(mock).not.toHaveBeenCalled();
    });
  });
});
