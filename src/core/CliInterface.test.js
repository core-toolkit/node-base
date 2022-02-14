const CliInterface = require('./CliInterface');
const Str = require('../utils/Str');


const methods = ['resolve', 'resolveTemplate', 'exists', 'mkdirp', 'exec', 'copy', 'read', 'readTemplate', 'write', 'packageJSON', 'readTemplateAndReplace', 'template', 'addToConfig', 'addToRoot', 'addAppToRoot', 'addPackage'];

const files = {
  '/base/foo.txt': 'test foo',
  '/base/packages/node-base/src/cli/templates/foo/bar.tpl': '1 __foo__ 2 __bar__ 3 __foo__',
  '/base/packages/node-base/src/cli/templates/src/root-register.js': '  App.register(\'__type__\', \'__name____type__\', __name____type__);\n',
  '/base/packages/node-base/src/cli/templates/src/root-register-app.js': ', Make__name__App',
  '/base/packages/node-base/src/cli/templates/src/root-require.js': 'const __name____type__ = require(\'__path__/__name____type__.js\');\n',
  '/base/packages/node-base/src/cli/templates/src/root-require-app.js': 'const Make__name__App = require(\'__path__\');\n',
  '/base/packages/node-base-baz/src/cli/templates/foo/bar.txt': 'test bar',
  '/base/packages/node-base-foo/src/cli/commands/init.js': 'module.exports = () => {};',
  '/base/packages/node-base-foo/src/cli/templates/config.js': 'exports.foo = __num__;\n',
  '/base/packages/node-base-foo/src/cli/templates/require.js': 'const __name__ = __path__;\n',
  '/base/packages/node-base-foo/src/cli/templates/register.js': '  console.log(__name__);\n\n',
  '/base/packages/node-base-qux/src/cli/commands/init.js': 'module.exports = () => {};',
  '/base/package.json': '{"foo":"bar","baz":123,"nodeBase":{"version":1,"packages":["node-base-foo","node-base-baz"]}}',
  '/base/src/config.js': 'exports.main = 1;\n',
  '/base/src/root.js': `\
const MakeApp = require('node-base');
const DbApp = require('node-base-db');

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
};
const iface = CliInterface(fs, cp, () => ['Util', 'Client', 'Service', 'UseCase'])({
  Util: { Func: { memoize: (fn) => fn }, Str },
  Core: { Project: { path: '/base', packagesPath: '/base/packages' } },
});

describe('CliInterface', () => {
  beforeEach(() => Object.keys(fs).map((key) => fs[key]).concat(cp.spawnSync).forEach((fn) => fn.mockClear()));

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
      expect(resolved).toBe('/base/packages/node-base/src/cli/templates/foo/bar.js');
    });

    it('resolves templates from other packages', () => {
      const resolved = iface.resolveTemplate('baz:foo/bar.js');
      expect(resolved).toBe('/base/packages/node-base-baz/src/cli/templates/foo/bar.js');
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
      expect(cp.spawnSync).toHaveBeenLastCalledWith('foo', expect.arrayContaining(['bar', 'baz']), expect.any(Object));
    });
  });

  describe('.copy()', () => {
    it('copies the supplied template to the project directory', () => {
      iface.copy('bar/baz.js');
      expect(fs.copyFileSync).toHaveBeenLastCalledWith('/base/packages/node-base/src/cli/templates/bar/baz.js', '/base/bar/baz.js');
      expect(fs.mkdirSync).toHaveBeenLastCalledWith('/base/bar');
    });

    it('does not copy the template if the target already exists', () => {
      iface.copy('foo.txt');
      expect(fs.copyFileSync).not.toHaveBeenLastCalledWith('/base/packages/node-base/src/cli/templates/foo.txt', '/base/foo.txt');
    });

    it('overwrites existing targets', () => {
      iface.copy('foo.txt', true);
      expect(fs.copyFileSync).toHaveBeenLastCalledWith('/base/packages/node-base/src/cli/templates/foo.txt', '/base/foo.txt');
    });

    it('copies template from other packages', () => {
      iface.copy('baz:bar/baz.js');
      expect(fs.copyFileSync).toHaveBeenLastCalledWith('/base/packages/node-base-baz/src/cli/templates/bar/baz.js', '/base/bar/baz.js');
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
    "version": 1,
    "packages": [
      "node-base-foo",
      "node-base-baz"
    ]
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
const MakeApp = require('node-base');
const DbApp = require('node-base-db');

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
const MakeApp = require('node-base');
const DbApp = require('node-base-db');

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
const MakeApp = require('node-base');
const DbApp = require('node-base-db');

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
const MakeApp = require('node-base');
const DbApp = require('node-base-db');

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
const MakeApp = require('node-base');
const DbApp = require('node-base-db');
const MakeQuxApp = require('node-base-qux');

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

  describe('.addPackage()', () => {
    it('installs new packages', () => {
      iface.addPackage('foo');
      expect(cp.spawnSync).toHaveBeenCalledWith('git', expect.arrayContaining([
        'submodule',
        'add',
        expect.stringContaining('/foo.git'),
        'packages/foo/',
      ]), expect.any(Object));
      expect(fs.writeFileSync).toHaveBeenLastCalledWith('/base/package.json', `\
{
  "foo": "bar",
  "baz": 123,
  "nodeBase": {
    "version": 1,
    "packages": [
      "node-base-foo",
      "node-base-baz",
      "foo"
    ]
  }
}`);
    });

    it('re-installs existing packages', () => {
      iface.addPackage('node-base-baz');
      expect(cp.spawnSync).not.toHaveBeenCalledWith('git', expect.arrayContaining([
        'submodule',
        'add',
        expect.stringContaining('/node-base-baz.git'),
        'packages/node-base-baz/',
      ]), expect.any(Object));
      expect(cp.spawnSync).toHaveBeenLastCalledWith('npm', expect.arrayContaining(['i', 'packages/node-base-baz/']), expect.any(Object));
      expect(fs.writeFileSync).toHaveBeenLastCalledWith('/base/package.json', `\
{
  "foo": "bar",
  "baz": 123,
  "nodeBase": {
    "version": 1,
    "packages": [
      "node-base-foo",
      "node-base-baz"
    ]
  }
}`);
    });

    it('installs dev packages', () => {
      iface.addPackage('foo', true);
      expect(cp.spawnSync).toHaveBeenCalledWith('git', expect.arrayContaining([
        'submodule',
        'add',
        expect.stringContaining('/foo.git'),
        'packages/foo/',
      ]), expect.any(Object));
      expect(cp.spawnSync).toHaveBeenLastCalledWith('npm', expect.arrayContaining(['i', '-D', 'packages/foo/']), expect.any(Object));
      expect(fs.writeFileSync).toHaveBeenLastCalledWith('/base/package.json', `\
{
  "foo": "bar",
  "baz": 123,
  "nodeBase": {
    "version": 1,
    "packages": [
      "node-base-foo",
      "node-base-baz",
      "foo"
    ]
  }
}`);
    });

    it('runs initialization scripts for packages that include one', () => {
      const mock = jest.fn();
      jest.mock('/base/packages/node-base-foo/src/cli/commands/init.js', () => mock, { virtual: true });

      iface.addPackage('node-base-foo', false, 'foo');
      expect(mock).toHaveBeenLastCalledWith('foo', iface);
      expect(fs.writeFileSync).toHaveBeenLastCalledWith('/base/package.json', `\
{
  "foo": "bar",
  "baz": 123,
  "nodeBase": {
    "version": 1,
    "packages": [
      "node-base-foo",
      "node-base-baz"
    ]
  }
}`);
    });

    it('does not finalize packages on failure', () => {
      jest.mock('/base/packages/node-base-qux/src/cli/commands/init.js', () => () => { throw new Error(); }, { virtual: true });

      expect(() => iface.addPackage('node-base-qux', false, 'foo')).toThrow();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });
});
