module.exports = async (_, { copy, exec, exists, packageJSON, addBasePackage }, { prompt }) => {
  // Setup git
  if (!exists('.git')) {
    exec('git', 'init');
  }

  await packageJSON(async (pkg) => {
    pkg.name ??= await prompt(`name=${Project.name}`);
    pkg.main = 'src/index.js';
    pkg.dependencies ??= {};
    pkg.devDependencies ??= {};
    pkg.nodeBase ??= {
      packages: [],
    };
    pkg.scripts ??= {};
    pkg.scripts.start = 'node src/index.js';
    pkg.scripts.cli = 'node-base-cli';
    pkg.scripts.test = 'node-base-cli test';
  });

  await addBasePackage();
  await addBasePackage('dev', true);

  // Setup file structure
  copy('.gitignore');
  copy('.dockerignore');
  copy('Dockerfile');
  copy('jest.config.js');
  copy('src/config.js');
  copy('src/index.js');
  copy('src/root.js');
};
