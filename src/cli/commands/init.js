module.exports = ({ exec, execIfNotExists, mkdirp, copy, packageJSON }) => () => {
  // Setup git
  execIfNotExists('.git', 'git', 'init');
  copy('.gitignore');
  mkdirp('packages');
  execIfNotExists('packages/node-base', 'git', 'submodule', 'add', 'git@github.com:core-toolkit/node-base.git');

  // Setup npm
  execIfNotExists('package.json', 'npm', 'init', '--yes');

  const package = packageJSON();
  package.main = 'src/index.js';
  if (!package.dependencies) {
    package.dependencies = {};
  }
  packageJSON(package);

  if (!package.dependencies['node-base']) {
    exec('npm', 'i', 'packages/node-base/');
  }

  // Setup file structure
  copy('.dockerignore');
  copy('Dockerfile');

  mkdirp('src/application/controllers');
  mkdirp('src/application/routes');
  mkdirp('src/application/use-cases');

  mkdirp('src/infrastructure/clients');
  mkdirp('src/infrastructure/services');

  copy('src/cli.js');
  copy('src/config.js');
  copy('src/index.js');
  copy('src/root.js');
};
