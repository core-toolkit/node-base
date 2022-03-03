const Cli = require('./Cli');

const { PassThrough } = require('stream');
const { deepMockClear } = require('../utils/Mock');

const app = { Core: { Project: { path: '/' }, CliInterface: 'cli-iface' } };
const process = { chdir: jest.fn() };

describe('Cli', () => {
  beforeEach(() => deepMockClear(process));
  it('creates a CLI', () => {
    const MakeCli = Cli(process);
    expect(MakeCli).toBeInstanceOf(Function);
    const cli = MakeCli(app);
    expect(cli).toBeInstanceOf(Object);
  });

  describe('.register()', () => {
    it('registers single commands', () => {
      const cli = Cli(process)(app);
      cli.register({
        name: 'Test',
        exec: () => { },
        description: 'Test command',
      });
    });

    it('registers multiple commands', () => {
      const cli = Cli(process)(app);
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
      const cli = Cli(process)(app);
      cli.register({
        name: 'Test',
        args: [{ name: 'foo' }, 'bar'],
        exec: () => { },
        description: 'Test command',
      });
    });

    it('registers commands with default arguments', () => {
      const cli = Cli(process)(app);
      cli.register({
        name: 'Test',
        args: [{ name: 'foo', defaultValue: 'default1' }, 'bar=default2'],
        exec: () => { },
        description: 'Test command',
      });
    });

    it('registers commands with optional arguments', () => {
      const cli = Cli(process)(app);
      cli.register({
        name: 'Test',
        args: ['foo', { name: 'bar', optional: true }, '[baz]'],
        exec: () => { },
        description: 'Test command',
      });
    });

    it('registers commands with rest arguments', () => {
      const cli = Cli(process)(app);
      cli.register([
        {
          name: 'Test1',
          args: ['foo', '...bar'],
          exec: () => { },
          description: 'Test command 1',
        },
        {
          name: 'Test2',
          args: ['foo', { name: 'bar', rest: true }],
          exec: () => { },
          description: 'Test command 2',
        },
      ]);
    });

    it('registers commands with additional instructions', () => {
      const cli = Cli(process)(app);
      cli.register({
        name: 'Test',
        exec: () => { },
        description: 'Test command',
        help: 'Test command instructions',
      });
    });

    it('skips registering commands with the same name', () => {
      const cli = Cli(process)(app);
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
      const cli = Cli(process)(app);
      expect(() => cli.register()).toThrow();
      expect(() => cli.register('foo')).toThrow();
    });

    it('does not register commands with missing or invalid names', () => {
      const cli = Cli(process)(app);
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
      const cli = Cli(process)(app);
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
      const cli = Cli(process)(app);
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
      const cli = Cli(process)(app);
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
      const cli = Cli(process)(app);
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

    it('does not register commands with non-trailing defaults', () => {
      const cli = Cli(process)(app);
      expect(() => cli.register({
        name: 'Test',
        args: ['foo=123', 'bar'],
        exec: () => { },
        description: 'Test command',
      })).toThrow();
    });

    it('does not register commands with non-trailing optional arguments', () => {
      const cli = Cli(process)(app);
      expect(() => cli.register({
        name: 'Test',
        args: ['[foo]', 'bar'],
        exec: () => { },
        description: 'Test command',
      })).toThrow();
    });

    it('does not register commands with non-trailing rest arguments', () => {
      const cli = Cli(process)(app);
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
      const cli = Cli(process)(app);
      const mock = jest.fn();

      cli.register({
        name: 'Test1',
        args: ['arg1', { name: 'arg2', defaultValue: 'bar' }, 'arg3=baz', '[arg4]'],
        exec: mock.mockReturnValueOnce(123),
        description: 'Test command 1',
      });

      await expect(cli.run('Test1', 'foo')).resolves.toBe(123);
      expect(mock).toHaveBeenLastCalledWith({
        arg1: 'foo',
        arg2: 'bar',
        arg3: 'baz',
        arg4: undefined,
      }, 'cli-iface', { run: cli.run, list: cli.list, prompt: expect.any(Function) });
      expect(process.chdir).toHaveBeenCalledWith('/');

      cli.register({
        name: 'Test2',
        args: ['arg1', '[arg2]', '[...arg3=bar]'],
        exec: mock,
        description: 'Test command 2',
      });

      await expect(cli.run('Test2', 'foo')).resolves.toBe(0);
      expect(mock).toHaveBeenLastCalledWith({
        arg1: 'foo',
        arg2: undefined,
        arg3: ['bar'],
      }, 'cli-iface', expect.any(Object));

      cli.register({
        name: 'Test3',
        args: ['arg1', '...arg2'],
        exec: mock,
        description: 'Test command 3',
      });

      await cli.run('Test3', 'foo', 'bar', 'baz');
      expect(mock).toHaveBeenLastCalledWith({
        arg1: 'foo',
        arg2: ['bar', 'baz'],
      }, 'cli-iface', expect.any(Object));
    });

    it('does not run with empty or unknown commands', async () => {
      const cli = Cli(process)(app);
      await expect(cli.run()).rejects.toBeInstanceOf(cli.MissingCommand);
      await expect(cli.run('foo')).rejects.toBeInstanceOf(cli.InvalidCommand);
    });

    it('does not run with missing arguments', async () => {
      const cli = Cli(process)(app);
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
      const cli = Cli(process)(app);
      await expect(cli.run('help')).rejects.toBeInstanceOf(cli.InvalidInvocation);
    });
  });

  describe('.usage()', () => {
    it('returns the list of available commands', () => {
      const cli = Cli(process)(app);
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
      const cli = Cli(process)(app);
      cli.register({
        name: 'Test1',
        args: ['foo', 'bar=123'],
        exec: () => { },
        description: 'Test command 1',
      });
      cli.register({
        name: 'Test2',
        args: ['foo', { name: 'bar', rest: true }],
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
      const cli = Cli(process)(app);
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

  describe('.prompt()', () => {
    beforeEach(() => (process.stdin = PassThrough()));

    it('fetches single values', async () => {
      const cli = Cli(process)(app);
      process.stdin.push('foo\n');
      await expect(cli.prompt('name')).resolves.toBe('foo');

      process.stdin.push('\n');
      await expect(cli.prompt('name=bar')).resolves.toBe('bar');
    });

    it('fetches multiple values', async () => {
      const cli = Cli(process)(app);
      process.stdin.push('foo\n');
      process.stdin.push('bar\n');
      process.stdin.push('\n');
      await expect(cli.prompt('...name')).resolves.toEqual(['foo', 'bar']);

      process.stdin.push('\n');
      await expect(cli.prompt('...name=baz')).resolves.toEqual(['baz']);
    });

    it('retries until it fetches mandatory single values', async () => {
      const cli = Cli(process)(app);
      process.stdin.push('\n');
      process.stdin.push('\n');
      process.stdin.push('foo\n');
      await expect(cli.prompt('name')).resolves.toBe('foo');
    });

    it('retries until it fetches mandatory multiple values', async () => {
      const cli = Cli(process)(app);
      process.stdin.push('\n');
      process.stdin.push('\n');
      process.stdin.push('foo\n');
      process.stdin.push('bar\n');
      process.stdin.push('\n');
      await expect(cli.prompt('...name')).resolves.toEqual(['foo', 'bar']);
    });
  });
});
