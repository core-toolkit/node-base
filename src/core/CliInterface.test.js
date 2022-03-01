const CliInterface = require('./CliInterface');
const Str = require('../utils/Str');
const { deepMockClear } = require('../utils/Mock');


const methods = ['resolve', 'resolveTemplate', 'exists', 'mkdirp', 'exec', 'copy', 'read', 'readTemplate', 'write', 'packageLock', 'packageJSON', 'readTemplateAndReplace', 'template', 'addToConfig', 'addToRoot', 'addAppToRoot', 'addBasePackage', 'migrate'];

const files = {
  '/base/foo.txt': 'test foo',
  '/base/node_modules/@core-toolkit/node-base/src/cli/templates/foo/bar.tpl': '1 __foo__ 2 __bar__ 3 __foo__',
  '/base/node_modules/@core-toolkit/node-base/src/cli/templates/src/root-register.js': '  App.register(\'__type__\', \'__name____type__\', __name____type__);\n',
  '/base/node_modules/@core-toolkit/node-base/src/cli/templates/src/root-register-app.js': ', Make__name__App',
  '/base/node_modules/@core-toolkit/node-base/src/cli/templates/src/root-require.js': 'const __name____type__ = require(\'__path__/__name____type__.js\');\n',
  '/base/node_modules/@core-toolkit/node-base/src/cli/templates/src/root-require-app.js': 'const Make__name__App = require(\'@core-toolkit/__path__\');\n',
  '/base/node_modules/@core-toolkit/node-base-baz/src/cli/templates/foo/bar.txt': 'test bar',
  '/base/node_modules/@core-toolkit/node-base-foo/src/cli/commands/init.js': 'module.exports = () => {};',
  '/base/node_modules/@core-toolkit/node-base-foo/src/cli/migrations/0.1.0.js': '',
  '/base/node_modules/@core-toolkit/node-base-foo/src/cli/migrations/1.0.0.js': '',
  '/base/node_modules/@core-toolkit/node-base-foo/src/cli/migrations/1.1.0.js': '',
  '/base/node_modules/@core-toolkit/node-base-foo/src/cli/migrations/1.1.1.js': '',
  '/base/node_modules/@core-toolkit/node-base-foo/src/cli/templates/config.js': 'exports.foo = __num__;\n',
  '/base/node_modules/@core-toolkit/node-base-foo/src/cli/templates/require.js': 'const __name__ = __path__;\n',
  '/base/node_modules/@core-toolkit/node-base-foo/src/cli/templates/register.js': '  console.log(__name__);\n\n',
  '/base/node_modules/@core-toolkit/node-base-qux/src/cli/commands/init.js': 'module.exports = () => {};',
  '/base/package.json': '{"foo":"bar","baz":123,"nodeBase":{"version":"1.0.0","packages":{"node-base-foo":"1.1.1","node-base-baz":"1.0.0"}}}',
  '/base/package-lock.json': '{"packages":{"@core-toolkit/node-base-new":{"version":"2.0.0"},"@core-toolkit/node-base":{"version":"2.0.0"},"@core-toolkit/node-base-foo":{"version":"2.0.0"},"@core-toolkit/node-base-baz":{"version":"2.0.0" }}}',
  '/base/src/config.js': 'exports.main = 1;\n',
  '/base/src/root.js': `\
const MakeApp = require('@core-toolkit/node-base');
const DbApp = require('@core-toolkit/node-base-db');

const FooClient = require('./infrastructure/clients/FooClient.js');

const BarUseCase = require('./application/use-cases/BarUseCase.js');
const BazUseCase = require('./application/use-cases/BazUseCase.js');

module.exports = (Config) => {
  const App = MakeApp(Config, DbApp);

  App.register('Client', 'FooClient', FooClient);

  App.register('UseCase', 'BarUseCase', BarUseCase);
  App.register('UseCase', 'BazUseCase', BazUseCase);

  return App;
};`,
};
const cp = { spawnSync: jest.fn() };
const fs = {
  existsSync: jest.fn((path) => Object.keys(files).find((file) => file.indexOf(path) === 0) !== undefined),
  mkdirSync: jest.fn(),
  copyFileSync: jest.fn(),
  readFileSync: jest.fn((path) => Buffer.from(files[path] ?? '')),
  writeFileSync: jest.fn(),
  readdirSync: jest.fn((path) => Object.keys(files).filter((file) => file.startsWith(path)).map((file) => file.substring(path.length + 1))),
};
const iface = CliInterface(fs, cp, () => ['Util', 'Client', 'Service', 'UseCase'])({
  Util: { Func: { memoize: (fn) => fn }, Str },
  Core: { Project: { path: '/base', nodeBase: { packages: { 'node-base-foo': '1.1.1' }} } },
});

describe('CliInterface', () => {
  beforeEach(() => deepMockClear({ cp, fs }));

  it('constructs a CLI interface', () => {
    for (const method of methods) {
      expect(iface).toHaveProperty(method, expect.any(Function));
    }
  });

  describe('.resolve()', () => {
    it('resolves absolute paths', () => {
      const resolved = iface.resolve('/foo/bar/../baz');
      expect(resolved).toBe('/foo/baz');
    });

    it('resolves absolute paths with multiple parts', () => {
      const resolved = iface.resolve('/foo', 'bar/', '../baz');
      expect(resolved).toBe('/foo/baz');
    });

    it('resolves relative paths', () => {
      const resolved = iface.resolve('foo/bar/../baz');
      expect(resolved).toBe('/base/foo/baz');
    });

    it('resolves relative paths with multiple parts', () => {
      const resolved = iface.resolve('foo', 'bar/', '../baz');
      expect(resolved).toBe('/base/foo/baz');
    });
  });

  describe('.resolveTemplate()', () => {
    it('resolves templates', () => {
      const resolved = iface.resolveTemplate('foo/bar.js');
      expect(resolved).toBe('/base/node_modules/@core-toolkit/node-base/src/cli/templates/foo/bar.js');
    });

    it('resolves templates from other packages', () => {
      const resolved = iface.resolveTemplate('baz:foo/bar.js');
      expect(resolved).toBe('/base/node_modules/@core-toolkit/node-base-baz/src/cli/templates/foo/bar.js');
    });
  });

  describe('.exists()', () => {
    it('redirects calls to fs with the correct path', () => {
      expect(iface.exists('foo/bar')).toBe(false);
      expect(fs.existsSync).toHaveBeenLastCalledWith('/base/foo/bar');
      expect(iface.exists('src/config.js')).toBe(true);
      expect(fs.existsSync).toHaveBeenLastCalledWith('/base/src/config.js');
    });
  });

  describe('.mkdirp()', () => {
    it('recursively creates directories if needed', () => {
      iface.mkdirp('bar/baz');
      expect(fs.mkdirSync).not.toHaveBeenCalledWith('/base');
      expect(fs.mkdirSync).toHaveBeenCalledWith('/base/bar');
      expect(fs.mkdirSync).toHaveBeenLastCalledWith('/base/bar/baz');
    });
  });

  describe('.exec()', () => {
    it('executes the supplied command with the correct parameters', () => {
      iface.exec('foo', 'bar', 'baz');
      expect(cp.spawnSync).toHaveBeenLastCalledWith('foo', ['bar', 'baz'], expect.any(Object));
    });
  });

  describe('.copy()', () => {
    it('copies the supplied template to the project directory', () => {
      iface.copy('bar/baz.js');
      expect(fs.copyFileSync).toHaveBeenLastCalledWith('/base/node_modules/@core-toolkit/node-base/src/cli/templates/bar/baz.js', '/base/bar/baz.js');
      expect(fs.mkdirSync).toHaveBeenLastCalledWith('/base/bar');
    });

    it('does not copy the template if the target already exists', () => {
      iface.copy('foo.txt');
      expect(fs.copyFileSync).not.toHaveBeenLastCalledWith('/base/node_modules/@core-toolkit/node-base/src/cli/templates/foo.txt', '/base/foo.txt');
    });

    it('overwrites existing targets', () => {
      iface.copy('foo.txt', true);
      expect(fs.copyFileSync).toHaveBeenLastCalledWith('/base/node_modules/@core-toolkit/node-base/src/cli/templates/foo.txt', '/base/foo.txt');
    });

    it('copies template from other packages', () => {
      iface.copy('baz:bar/baz.js');
      expect(fs.copyFileSync).toHaveBeenLastCalledWith('/base/node_modules/@core-toolkit/node-base-baz/src/cli/templates/bar/baz.js', '/base/bar/baz.js');
      expect(fs.mkdirSync).toHaveBeenLastCalledWith('/base/bar');
    });
  });

  describe('.read()', () => {
    it('reads the contents of the requested project file', () => {
      const contents = iface.read('foo.txt');
      expect(contents).toBe('test foo');
    });
  });

  describe('.readTemplate()', () => {
    it('reads the contents of the requested template', () => {
      const contents = iface.readTemplate('baz:foo/bar.txt');
      expect(contents).toBe('test bar');
    });
  });

  describe('.write()', () => {
    it('writes the supplied contents to a file', () => {
      iface.write('bar/baz.txt', 'test');
      expect(fs.writeFileSync).toHaveBeenLastCalledWith('/base/bar/baz.txt', 'test');
      expect(fs.mkdirSync).toHaveBeenLastCalledWith('/base/bar');
    });
  });

  describe('.packageLock()', () => {
    it('returns the contents of the package-lock.json file', () => {
      const packageLock = iface.packageLock();
      expect(packageLock).toEqual({
        packages: {
          "@core-toolkit/foo": { version: "2.0.0" },
          "@core-toolkit/node-base": { version: "2.0.0" },
          "@core-toolkit/node-base-foo": { version: "2.0.0" },
          "@core-toolkit/node-base-baz": { version: "2.0.0" },
        },
      });
    });
  });

  describe('.packageJSON()', () => {
    it('opens the package.json file for reading and writes back all changes', () => {
      iface.packageJSON((pkg) => {
        pkg.foo = 'test';
        pkg.abc = [];
        delete pkg.baz;
      });
      expect(fs.writeFileSync).toHaveBeenLastCalledWith('/base/package.json', `\
{
  "foo": "test",
  "nodeBase": {
    "version": "1.0.0",
    "packages": {
      "node-base-foo": "1.1.1",
      "node-base-baz": "1.0.0"
    }
  },
  "abc": []
}`);
    });
  });

  describe('.readTemplateAndReplace()', () => {
    it('returns the requested template filled in', () => {
      const replaced = iface.readTemplateAndReplace('foo/bar.tpl', { foo: 'abc', bar: 'def' });
      expect(replaced).toBe('1 abc 2 def 3 abc');
    });

    it('throws on missing replacements', () => {
      expect(() => iface.readTemplateAndReplace('foo/bar.tpl', { foo: 'abc' })).toThrow();
    });
  });

  describe('.template()', () => {
    it('fills in the requested template and writes it to the provided target location', () => {
      iface.template('foo/bar.tpl', 'foo/bar.txt', { foo: 'abc', bar: 'def' });
      expect(fs.writeFileSync).toHaveBeenLastCalledWith('/base/foo/bar.txt', '1 abc 2 def 3 abc')
    });
  });

  describe('.addToConfig()', () => {
    it('appends the specified template to the project configuration', () => {
      iface.addToConfig('foo:config.js', { num: 2 });
      expect(fs.writeFileSync).toHaveBeenLastCalledWith('/base/src/config.js', 'exports.main = 1;\nexports.foo = 2;\n');
    });
  });

  describe('.addToRoot()', () => {
    it('adds a component to its own group', () => {
      iface.addToRoot('UseCase', 'Qux', './application/use-cases');
      expect(fs.writeFileSync).toHaveBeenLastCalledWith('/base/src/root.js', `\
const MakeApp = require('@core-toolkit/node-base');
const DbApp = require('@core-toolkit/node-base-db');

const FooClient = require('./infrastructure/clients/FooClient.js');

const BarUseCase = require('./application/use-cases/BarUseCase.js');
const BazUseCase = require('./application/use-cases/BazUseCase.js');
const QuxUseCase = require('./application/use-cases/QuxUseCase.js');

module.exports = (Config) => {
  const App = MakeApp(Config, DbApp);

  App.register('Client', 'FooClient', FooClient);

  App.register('UseCase', 'BarUseCase', BarUseCase);
  App.register('UseCase', 'BazUseCase', BazUseCase);
  App.register('UseCase', 'QuxUseCase', QuxUseCase);

  return App;
};`);
    });

    it('adds a component to its nearest group', () => {
      iface.addToRoot('Service', 'Qux', './infrastructure/services');
      expect(fs.writeFileSync).toHaveBeenLastCalledWith('/base/src/root.js', `\
const MakeApp = require('@core-toolkit/node-base');
const DbApp = require('@core-toolkit/node-base-db');

const FooClient = require('./infrastructure/clients/FooClient.js');

const QuxService = require('./infrastructure/services/QuxService.js');

const BarUseCase = require('./application/use-cases/BarUseCase.js');
const BazUseCase = require('./application/use-cases/BazUseCase.js');

module.exports = (Config) => {
  const App = MakeApp(Config, DbApp);

  App.register('Client', 'FooClient', FooClient);

  App.register('Service', 'QuxService', QuxService);

  App.register('UseCase', 'BarUseCase', BarUseCase);
  App.register('UseCase', 'BazUseCase', BazUseCase);

  return App;
};`);
    });

    it('adds a component to the root group', () => {
      iface.addToRoot('Util', 'Qux', './infrastructure/utils');
      expect(fs.writeFileSync).toHaveBeenLastCalledWith('/base/src/root.js', `\
const MakeApp = require('@core-toolkit/node-base');
const DbApp = require('@core-toolkit/node-base-db');

const QuxUtil = require('./infrastructure/utils/QuxUtil.js');

const FooClient = require('./infrastructure/clients/FooClient.js');

const BarUseCase = require('./application/use-cases/BarUseCase.js');
const BazUseCase = require('./application/use-cases/BazUseCase.js');

module.exports = (Config) => {
  const App = MakeApp(Config, DbApp);

  App.register('Util', 'QuxUtil', QuxUtil);

  App.register('Client', 'FooClient', FooClient);

  App.register('UseCase', 'BarUseCase', BarUseCase);
  App.register('UseCase', 'BazUseCase', BazUseCase);

  return App;
};`);
    });

    it('adds an app middleware with custom partials and matchers', () => {
      iface.addToRoot('App', 'Qux', '123', 'foo:register.js', /{\n/, 'foo:require.js', /^/);
      expect(fs.writeFileSync).toHaveBeenLastCalledWith('/base/src/root.js', `\
const Qux = 123;
const MakeApp = require('@core-toolkit/node-base');
const DbApp = require('@core-toolkit/node-base-db');

const FooClient = require('./infrastructure/clients/FooClient.js');

const BarUseCase = require('./application/use-cases/BarUseCase.js');
const BazUseCase = require('./application/use-cases/BazUseCase.js');

module.exports = (Config) => {
  console.log(Qux);

  const App = MakeApp(Config, DbApp);

  App.register('Client', 'FooClient', FooClient);

  App.register('UseCase', 'BarUseCase', BarUseCase);
  App.register('UseCase', 'BazUseCase', BazUseCase);

  return App;
};`);
    });

    it('throws when trying to add an unknown component', () => {
      expect(() => iface.addToRoot('Foo', 'Bar', 'baz')).toThrow();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('.addAppToRoot()', () => {
    it('composes another application into the current one', () => {
      iface.addAppToRoot('Qux');
      expect(fs.writeFileSync).toHaveBeenLastCalledWith('/base/src/root.js', `\
const MakeApp = require('@core-toolkit/node-base');
const DbApp = require('@core-toolkit/node-base-db');
const MakeQuxApp = require('@core-toolkit/node-base-qux');

const FooClient = require('./infrastructure/clients/FooClient.js');

const BarUseCase = require('./application/use-cases/BarUseCase.js');
const BazUseCase = require('./application/use-cases/BazUseCase.js');

module.exports = (Config) => {
  const App = MakeApp(Config, DbApp, MakeQuxApp);

  App.register('Client', 'FooClient', FooClient);

  App.register('UseCase', 'BarUseCase', BarUseCase);
  App.register('UseCase', 'BazUseCase', BazUseCase);

  return App;
};`);
    });
  });

  describe('.addBasePackage()', () => {
    it('installs new packages', () => {
      iface.addBasePackage('foo');
      expect(cp.spawnSync).toHaveBeenCalledWith('npm', ['i', '@core-toolkit/foo'], expect.any(Object));
      expect(fs.writeFileSync).toHaveBeenLastCalledWith('/base/package.json', `\
{
  "foo": "bar",
  "baz": 123,
  "nodeBase": {
    "version": "1.0.0",
    "packages": {
      "node-base-foo": "1.0.0",
      "node-base-baz": "1.0.0",
      "foo": "2.0.0"
    }
  }
}`);
    });

    it('re-installs existing packages', () => {
      iface.addBasePackage('node-base-baz');
      expect(cp.spawnSync).toHaveBeenLastCalledWith('npm', ['i', '@core-toolkit/node-base-baz'], expect.any(Object));
      expect(fs.writeFileSync).toHaveBeenLastCalledWith('/base/package.json', `\
{
  "foo": "bar",
  "baz": 123,
  "nodeBase": {
    "version": "1.0.0",
    "packages": {
      "node-base-foo": "1.0.0",
      "node-base-baz": "2.0.0"
    }
  }
}`);
    });

    it('installs dev packages', () => {
      iface.addBasePackage('foo', true);
      expect(cp.spawnSync).toHaveBeenLastCalledWith('npm', ['i', '-D', '@core-toolkit/foo'], expect.any(Object));
      expect(fs.writeFileSync).toHaveBeenLastCalledWith('/base/package.json', `\
{
  "foo": "bar",
  "baz": 123,
  "nodeBase": {
    "version": "1.0.0",
    "packages": {
      "node-base-foo": "1.0.0",
      "node-base-baz": "1.0.0",
      "foo": "2.0.0"
    }
  }
}`);
    });

    it('installs the base package', () => {
      iface.addBasePackage('node-base');
      expect(cp.spawnSync).toHaveBeenLastCalledWith('npm', ['i', '@core-toolkit/node-base'], expect.any(Object));
      expect(fs.writeFileSync).toHaveBeenLastCalledWith('/base/package.json', `\
{
  "foo": "bar",
  "baz": 123,
  "nodeBase": {
    "version": "2.0.0",
    "packages": {
      "node-base-foo": "1.0.0",
      "node-base-baz": "1.0.0"
    }
  }
}`);
    });

    it('runs initialization scripts for packages that include one', () => {
      const mock = jest.fn();
      jest.mock('/base/node_modules/@core-toolkit/node-base-foo/src/cli/commands/init.js', () => mock, { virtual: true });

      iface.addBasePackage('node-base-foo', false, 'foo');
      expect(mock).toHaveBeenLastCalledWith('foo', iface);
      expect(fs.writeFileSync).toHaveBeenLastCalledWith('/base/package.json', `\
{
  "foo": "bar",
  "baz": 123,
  "nodeBase": {
    "version": "1.0.0",
    "packages": {
      "node-base-foo": "2.0.0",
      "node-base-baz": "1.0.0"
    }
  }
}`);
    });

    it('does not finalize packages on failure', () => {
      jest.mock('/base/node_modules/@core-toolkit/node-base-qux/src/cli/commands/init.js', () => () => { throw new Error(); }, { virtual: true });

      expect(() => iface.addBasePackage('node-base-qux', false, 'foo')).toThrow();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('.migrate()', () => {
    it('runs the relevant migration scripts', async () => {
      const versions = ['0.1.0', '1.0.0', '1.1.0', '1.1.1'];
      const mocks = {};

      for (const mockVersion of versions) {
        mocks[mockVersion] = jest.fn();
        jest.mock(`/base/node_modules/@core-toolkit/node-base-foo/src/cli/migrations/${mockVersion}.js`, () => mocks[mockVersion], { virtual: true });
      }
      await iface.migrate('node-base-foo');

      for (const version of versions.slice(0, 3)) {
        expect(fs.writeFileSync).not.toHaveBeenCalledWith('/base/package.json', expect.stringContaining(`"node-base-foo": "${version}"`));
        expect(mocks[version]).not.toHaveBeenCalled();
      }

      for (const version of versions.slice(3)) {
        expect(fs.writeFileSync).toHaveBeenCalledWith('/base/package.json', expect.stringContaining(`"node-base-foo": "${version}"`));
        expect(mocks[version]).toHaveBeenCalled();
      }
    });
  });
});
