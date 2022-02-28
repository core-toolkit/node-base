const Cli = require('./Cli');
const app = { Core: { Project: { path: '/' }, CliInterface: 'cli-iface' } };

describe('Cli', () => {
  it('creates a CLI', () => {
    const cli = Cli(app);
    expect(cli).toBeInstanceOf(Object);
  });

  describe('.register()', () => {
    it('registers single commands', () => {
      const cli = Cli(app);
      cli.register({
        name: 'Test',
        exec: () => { },
        description: 'Test command',
      });
    });

    it('registers multiple commands', () => {
      const cli = Cli(app);
      cli.register([
        {
          name: 'Test1',
          exec: () => { },
          description: 'Test command 1',
        },
        {
          name: 'Test2',
          exec: () => { },
          description: 'Test command 2',
        },
      ]);
    });

    it('registers commands with arguments', () => {
      const cli = Cli(app);
      cli.register({
        name: 'Test',
        args: ['foo', 'bar'],
        exec: () => { },
        description: 'Test command',
      });
    });

    it('registers commands with default arguments', () => {
      const cli = Cli(app);
      cli.register({
        name: 'Test',
        args: ['foo', 'bar=default2'],
        defaults: { foo: 'default1' },
        exec: () => { },
        description: 'Test command',
      });
    });

    it('registers commands with optional arguments', () => {
      const cli = Cli(app);
      cli.register({
        name: 'Test',
        args: ['foo', 'bar', '[baz]'],
        optional: ['bar'],
        exec: () => { },
        description: 'Test command',
      });
    });

    it('registers commands with rest arguments', () => {
      const cli = Cli(app);
      cli.register([
        {
          name: 'Test1',
          args: ['foo', '...bar'],
          exec: () => { },
          description: 'Test command 1',
        },
        {
          name: 'Test2',
          args: ['foo', 'bar'],
          rest: true,
          exec: () => { },
          description: 'Test command 2',
        },
      ]);
    });

    it('registers commands with additional instructions', () => {
      const cli = Cli(app);
      cli.register({
        name: 'Test',
        exec: () => { },
        description: 'Test command',
        help: 'Test command instructions',
      });
    });

    it('skips registering commands with the same name', () => {
      const cli = Cli(app);
      cli.register({
        name: 'Test',
        exec: () => { },
        description: 'Test command',
      });

      expect(() => cli.register({
        name: 'Test',
        exec: () => { },
        description: 'Test command',
      }, true)).not.toThrow();

      expect(cli.list()).toEqual(['Test']);
    });

    it('does not register missing or invalid commands', () => {
      const cli = Cli(app);
      expect(() => cli.register()).toThrow();
      expect(() => cli.register('foo')).toThrow();
    });

    it('does not register commands with missing or invalid names', () => {
      const cli = Cli(app);
      expect(() => cli.register({
        exec: () => { },
        description: 'Test command',
      })).toThrow();
      expect(() => cli.register({
        name: '',
        exec: () => { },
        description: 'Test command',
      })).toThrow();
      expect(() => cli.register({
        name: 123,
        exec: () => { },
        description: 'Test command',
      })).toThrow();
    });

    it('does not allow registering commands with the same name', () => {
      const cli = Cli(app);
      cli.register({
        name: 'Test',
        exec: () => { },
        description: 'Test command',
      });

      expect(() => cli.register({
        name: 'Test',
        exec: () => { },
        description: 'Test command',
      })).toThrow();
    });

    it('does not register commands with missing or invalid functions', () => {
      const cli = Cli(app);
      expect(() => cli.register({
        name: 'Test 1',
        description: 'Test command 1',
      })).toThrow();
      expect(() => cli.register({
        name: 'Test 2',
        exec: 'foo',
        description: 'Test command 2',
      })).toThrow();
    });

    it('does not register commands with missing or invalid descriptions', () => {
      const cli = Cli(app);
      expect(() => cli.register({
        name: 'Test1',
        exec: () => { },
      })).toThrow();
      expect(() => cli.register({
        name: 'Test2',
        exec: () => { },
        description: '',
      })).toThrow();
      expect(() => cli.register({
        name: 'Test3',
        exec: () => { },
        description: 123,
      })).toThrow();
    });

    it('does not register commands with missing or invalid arguments', () => {
      const cli = Cli(app);
      expect(() => cli.register({
        name: 'Test1',
        args: undefined,
        description: 'Test command 1',
        exec: () => { },
      })).toThrow();
      expect(() => cli.register({
        name: 'Test2',
        args: 'foo',
        description: 'Test command 2',
        exec: () => { },
      })).toThrow();
    });

    it('does not register commands with missing or invalid defaults', () => {
      const cli = Cli(app);
      expect(() => cli.register({
        name: 'Test1',
        defaults: undefined,
        description: 'Test command 1',
        exec: () => { },
      })).toThrow();
      expect(() => cli.register({
        name: 'Test2',
        defaults: 'foo',
        description: 'Test command 2',
        exec: () => { },
      })).toThrow();
    });

    it('does not register commands with non-trailing defaults', () => {
      const cli = Cli(app);
      expect(() => cli.register({
        name: 'Test',
        args: ['foo=123', 'bar'],
        exec: () => { },
        description: 'Test command',
      })).toThrow();
    });

    it('does not register commands with missing or invalid optional arguments', () => {
      const cli = Cli(app);
      expect(() => cli.register({
        name: 'Test1',
        optional: undefined,
        description: 'Test command 1',
        exec: () => { },
      })).toThrow();
      expect(() => cli.register({
        name: 'Test2',
        optional: 'foo',
        description: 'Test command 2',
        exec: () => { },
      })).toThrow();
    });

    it('does not register commands with non-trailing optional arguments', () => {
      const cli = Cli(app);
      expect(() => cli.register({
        name: 'Test',
        args: ['[foo]', 'bar'],
        exec: () => { },
        description: 'Test command',
      })).toThrow();
    });

    it('does not register commands with missing or invalid rest arguments', () => {
      const cli = Cli(app);
      expect(() => cli.register({
        name: 'Test1',
        rest: undefined,
        description: 'Test command 1',
        exec: () => { },
      })).toThrow();
      expect(() => cli.register({
        name: 'Test2',
        rest: 'foo',
        description: 'Test command 2',
        exec: () => { },
      })).toThrow();
    });

    it('does not register commands with non-trailing rest arguments', () => {
      const cli = Cli(app);
      expect(() => cli.register({
        name: 'Test1',
        args: ['...foo', 'bar'],
        exec: () => { },
        description: 'Test command 1',
      })).toThrow();
      expect(() => cli.register({
        name: 'Test2',
        args: ['foo', '[...bar]', '[baz]'],
        exec: () => { },
        description: 'Test command 2',
      })).toThrow();
    });
  });

  describe('.run()', () => {
    it('runs the supplied command', async () => {
      const cli = Cli(app);
      const mock = jest.fn();

      cli.register({
        name: 'Test1',
        args: ['arg1', 'arg2', 'arg3=baz', '[arg4]'],
        defaults: { arg2: 'bar' },
        exec: mock.mockReturnValueOnce(123),
        description: 'Test command 1',
      });

      await expect(cli.run('Test1', 'foo')).resolves.toBe(123);
      expect(mock).toHaveBeenLastCalledWith(expect.objectContaining({
        arg1: 'foo',
        arg2: 'bar',
        arg3: 'baz',
        arg4: undefined,
      }), 'cli-iface', expect.objectContaining({ run: cli.run, list: cli.list }));

      cli.register({
        name: 'Test2',
        args: ['arg1', '[arg2]', '[...arg3=bar]'],
        exec: mock,
        description: 'Test command 2',
      });

      await expect(cli.run('Test2', 'foo')).resolves.toBe(0);
      expect(mock).toHaveBeenLastCalledWith(expect.objectContaining({
        arg1: 'foo',
        arg2: undefined,
        arg3: ['bar'],
      }), 'cli-iface', expect.objectContaining({ run: cli.run, list: cli.list }));

      cli.register({
        name: 'Test3',
        args: ['arg1', '...arg2'],
        exec: mock,
        description: 'Test command 3',
      });

      await cli.run('Test3', 'foo', 'bar', 'baz');
      expect(mock).toHaveBeenLastCalledWith(expect.objectContaining({
        arg1: 'foo',
        arg2: ['bar', 'baz'],
      }), 'cli-iface', expect.objectContaining({ run: cli.run, list: cli.list }));
    });

    it('does not run with empty or unknown commands', async () => {
      const cli = Cli(app);
      await expect(cli.run()).rejects.toBeInstanceOf(cli.MissingCommand);
      await expect(cli.run('foo')).rejects.toBeInstanceOf(cli.InvalidCommand);
    });

    it('does not run with missing arguments', async () => {
      const cli = Cli(app);
      const mock = jest.fn();

      cli.register({
        name: 'Test1',
        args: ['foo'],
        exec: mock,
        description: 'Test command 1',
      });

      await expect(cli.run('Test1')).rejects.toBeInstanceOf(cli.InvalidArgument);
      expect(mock).not.toHaveBeenCalled();

      cli.register({
        name: 'Test2',
        args: ['...foo'],
        exec: mock,
        description: 'Test command 2',
      });

      await expect(cli.run('Test2')).rejects.toBeInstanceOf(cli.InvalidArgument);
      expect(mock).not.toHaveBeenCalled();
    });

    it('does not allow executing the "help" command directly', async () => {
      const cli = Cli(app);
      await expect(cli.run('help')).rejects.toBeInstanceOf(cli.InvalidInvocation);
    });
  });

  describe('.usage()', () => {
    it('returns the list of available commands', () => {
      const cli = Cli(app);
      cli.register({
        name: 'Test1',
        exec: () => { },
        description: 'Test command 1',
      });
      cli.register({
        name: 'Test2',
        exec: () => { },
        description: 'Test command 2',
      });

      const usage = cli.usage();
      expect(usage).toMatch(/Test1\s+Test command 1/);
      expect(usage).toMatch(/Test2\s+Test command 2/);
    });

    it('returns the usage information of a specified command', () => {
      const cli = Cli(app);
      cli.register({
        name: 'Test1',
        args: ['foo', 'bar=123'],
        exec: () => { },
        description: 'Test command 1',
      });
      cli.register({
        name: 'Test2',
        args: ['foo', 'bar'],
        rest: true,
        exec: () => { },
        description: 'Test command 2',
        help: 'Test command instructions',
      });

      const usage1 = cli.usage('Test1');
      expect(usage1).toMatch('Test1 <foo> [bar=123]');

      const usage2 = cli.usage('Test2');
      expect(usage2).toMatch('Test2 <foo> <...bar>');
      expect(usage2).toMatch('Test command instructions');
    });
  });

  describe('.list()', () => {
    it('returns a list of registered commands', () => {
      const cli = Cli(app);
      cli.register({
        name: 'Test1',
        exec: () => { },
        description: 'Test command 1',
      });
      cli.register({
        name: 'Test2',
        exec: () => { },
        description: 'Test command 2',
      });

      const commands = cli.list();
      expect(commands).toEqual(['Test1', 'Test2']);
    });
  });
});
