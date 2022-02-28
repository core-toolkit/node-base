module.exports = (_, { copy, exec, exists, packageJSON, addBasePackage }) => {
  // Setup git
  if (!exists('.git')) {
    exec('git', 'init');
  }

  // Setup npm
  if (!exists('package.json')) {
    exec('npm', 'init', '--yes');
  }

  packageJSON((pkg) => {
    pkg.main = 'src/index.js';
    pkg.dependencies ??= {};
    pkg.devDependencies ??= {};
    pkg.nodeBase ??= {
      version: 1,
      packages: [],
    };
    pkg.scripts.start = 'node src/index.js';
    pkg.scripts.cli = 'node-base-cli';
    pkg.scripts.test = 'node-base-cli test';
  });

  addBasePackage('node-base');
  addBasePackage('node-base-dev', true);

  // Setup file structure
  copy('.gitignore');
  copy('.dockerignore');
  copy('Dockerfile');
  copy('jest.config.js');
  copy('src/config.js');
  copy('src/index.js');
  copy('src/root.js');
};
