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

  describe('.initAll()', () => {
    it('waits for all registered components to initialize', async () => {
      const app = MakeApp();
      const Test1 = jest.fn().mockReturnValue('foo');
      const Test2 = jest.fn();

      app.registerType('TestType1');
      app.registerType('TestType2', 'TestType1');
      app.register('TestType1', 'Test1', Test1);
      app.register('TestType2', 'Test2', Test2);
      await app.initAll();
      expect(Test1).toHaveBeenCalledTimes(1);
      expect(Test2).toHaveBeenCalledWith(expect.any(Object));
      expect(Test2).toHaveBeenCalledTimes(1);
      expect(Test2).toHaveBeenCalledWith(expect.objectContaining({
        TestType1: expect.objectContaining({ Test1: 'foo' }),
      }));
    });
  });

  describe('.start()', () => {
    it('starts the application', async () => {
      const app = MakeApp();
      await app.start();
    });

    it('does not start the application if already running', async () => {
      const app = MakeApp();
      await app.start();
      await expect(app.start()).rejects.toThrow();
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
