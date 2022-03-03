const assert = require('assert');
const { resolve, dirname } = require('path');

const toSemver = (version) => version.split('.').map((part) => Number(part));

module.exports = (fs, child_process, getTypes) => ({ Util: { Func, Str }, Core: { Project } }) => {
  const iface = {
    /**
     * @param  {...String} path
     * @returns {String}
     */
    resolve: (...path) => (path[0][0] === '/' ? resolve(...path) : resolve(Project.path, ...path)),

    /**
     * @param  {String} path
     * @returns {String}
     */
    resolveTemplate: (path) => {
      const parts = path.split(':');
      const pkg = ['node-base'];
      if (parts.length > 1) {
        [pkg[1], path] = parts;
      }
      return resolve(Project.path, 'node_modules/@core-toolkit', pkg.join('-'), 'src/cli/templates', path);
    },

    /**
     * @param  {String} path
     * @returns {Boolean}
     */
    exists: (path) => fs.existsSync(iface.resolve(path)),

    /**
     * @param  {String} parts
     */
    mkdirp: (path) => {
      path = iface.resolve(path);
      [...path.matchAll('/'), {}]
        .map(({ index }) => path.substring(0, index))
        .filter((v) => v !== '' && !iface.exists(v))
        .forEach((partialPath) => fs.mkdirSync(partialPath));
    },

    /**
     * @param {String} cmd
     * @param  {...String} args
     */
    exec: (cmd, ...args) => child_process.spawnSync(cmd, args, { stdio: 'inherit' }),

    /**
     * @param {String} path
     * @param {Boolean} overwrite
     */
    copy: (path, overwrite = false) => {
      const target = path.split(':').pop();
      iface.mkdirp(dirname(target));
      if (overwrite || !iface.exists(target)) {
        fs.copyFileSync(iface.resolveTemplate(path), iface.resolve(target));
      }
    },

    /**
     * @param {String} path
     * @returns {String}
     */
    read: (path) => fs.readFileSync(iface.resolve(path)).toString(),

    /**
     * @param {String} path
     * @returns {String}
     */
    readTemplate: Func.memoize((path) => fs.readFileSync(iface.resolveTemplate(path)).toString()),

    /**
     * @param {String} path
     * @param {String|Buffer} data
     */
    write: (path, data) => {
      iface.mkdirp(dirname(path));
      fs.writeFileSync(iface.resolve(path), data);
    },

    packageLock: () => JSON.parse(iface.read('package-lock.json')),

    /**
     * @param {(packageObj: Object) => Promise<void>} processor
     */
    packageJSON: async (processor) => {
      const pkg = JSON.parse(iface.read('package.json'));
      await processor(pkg);
      iface.write('package.json', JSON.stringify(pkg, undefined, 2));
    },

    /**
     * @param {String} src
     * @param {Object.<string, String>} replacements
     * @returns {String}
     */
    readTemplateAndReplace: (src, replacements) => {
      const tpl = iface.readTemplate(src);

      const tokens = Str.tokens(tpl);
      for (const token of tokens) {
        assert(token in replacements, `Replacement parameter '${token}' required by template '${src}' missing`);
      }

      return Str.replaceTokens(tpl, replacements);
    },

    /**
     * @param {String} src
     * @param {String} dst
     * @param {String} name
     * @param {Object.<string, String>} replacements
     */
    template: (src, dst, replacements) => {
      const processed = iface.readTemplateAndReplace(src, replacements);

      iface.write(dst, processed);
    },

    /**
     * @param {String} src
     * @param {Boolean} before
     * @param {Object.<string, String>} replacements
     */
    addToConfig: (src, replacements) => {
      const configFile = 'src/config.js';
      const input = iface.read(configFile);
      const processed = iface.readTemplateAndReplace(src, replacements);
      iface.write(configFile, `${input}${processed}`);
    },

    /**
     * @param {String} type
     * @param {String} name
     * @param {String} path
     */
    addToRoot: (type, name, path, regTpl = 'src/root-register.js', regRgx = null, reqTpl = 'src/root-require.js', reqRgx = null) => {
      const componentOrder = getTypes().reverse().concat('App');
      const startFrom = componentOrder.indexOf(type);
      assert(startFrom !== -1, `Unknown type '${type}'`);

      const reqStr = iface.readTemplateAndReplace(reqTpl, { name, type, path });
      const regStr = iface.readTemplateAndReplace(regTpl, { name, type });

      const root = iface.read('src/root.js');

      const order = componentOrder.slice(startFrom);

      let reqPadding = '';
      let regPadding = '';

      const reqOrder = order
        .map((v) => RegExp(`${v}\\.js'\\);\n`))
        .concat(/App = require[^;]+;\n/);
      if (reqRgx) {
        reqOrder.unshift(reqRgx);
      }
      const regOrder = order
        .map((v) => RegExp(`${v}\\);\n`))
        .concat(/MakeApp\([^;]+;\n/);
        if (regRgx) {
          regOrder.unshift(regRgx);
        }

      const reqIndex = reqOrder.reduce((index, v, i) => {
          if (index !== -1) return index;
          if (i) reqPadding = '\n';
          return Str.lastIndexOf(root, v, true);
        }, -1);
      const regIndex = regOrder.reduce((index, v, i) => {
        if (index !== -1) return index;
        if (i) regPadding = '\n';
        return Str.lastIndexOf(root, v, true);
      }, -1);


      const newRoot = root.substring(0, reqIndex) +
        reqPadding + reqStr + root.substring(reqIndex, regIndex) +
        regPadding + regStr + root.substring(regIndex);

      iface.write('src/root.js', newRoot);
    },

    /**
     * @param {String} name
     * @param {String} pkg
     */
    addAppToRoot: (name, pkg = `node-base-${name.toLowerCase()}`) => {
      iface.addToRoot('App', name, pkg, 'src/root-register-app.js', /MakeApp\([^)]+/, 'src/root-require-app.js', /App = require[^;]+;\n/);
    },

    migrate: async (name) => {
      if (!(name in Project.nodeBase.packages)) {
        return;
      }
      const version = Project.nodeBase.packages[name];
      const semver = toSemver(version);
      const migrationsPath = `${Project.path}/node_modules/@core-toolkit/${name}/src/cli/migrations`;
      const migrations = fs.readdirSync(migrationsPath);
      for (const migration of migrations) {
        const migrationSemver = toSemver(migration);
        if (semver[0] > migrationSemver[0] || semver[1] > migrationSemver[1] || semver[2] > migrationSemver[2]) {
          continue;
        }
        const migrationFn = require(`${migrationsPath}/${migration}`);
        await migrationFn(iface);
        await iface.packageJSON((pkg) => (pkg.nodeBase.packages[name] = version));
      }
    },

    /**
     * @param {String} part
     * @param {Boolean} dev
     * @param {Object} args
     */
    addBasePackage: async (part, dev, args) => {
      const name = part ? `node-base-${part}` : 'node-base';
      const packageName = `@core-toolkit/${name}`;
      if (dev) {
        iface.exec('npm', 'i', '-D', packageName);
      } else {
        iface.exec('npm', 'i', packageName);
      }
      const initPath = `node_modules/${packageName}/src/cli/commands/init.js`;
      if (iface.exists(initPath)) {
        const initFn = require(iface.resolve(initPath));
        await initFn(args, iface);
      }
      await iface.migrate(name);
      await iface.packageJSON((pkg) => {
        const lockFile = iface.packageLock();
        const { version } = lockFile.packages[packageName];
        pkg.nodeBase.packages[name] = version;
      });
    },
  };

  return iface;
};
