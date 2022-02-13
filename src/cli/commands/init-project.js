module.exports = (_, { copy, exec, exists, packageJSON, addPackage }) => {
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
    pkg.scripts.start ??= 'node src/index.js';
    pkg.scripts.cli = 'node-base-cli';
    pkg.scripts.test = 'jest --detectOpenHandles';
  });

  addPackage('node-base');
  addPackage('node-base-dev', true);

  // Setup file structure
  copy('.gitignore');
  copy('.dockerignore');
  copy('Dockerfile');
  copy('jest.config.js');
  copy('src/config.js');
  copy('src/index.js');
  copy('src/root.js');
};
