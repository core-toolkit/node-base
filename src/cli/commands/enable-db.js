const supportedDialects = ['postgres'];
const dependencies = {
  postgres: ['pg', 'pg-hstore'],
};

module.exports = ({ read, mkdirp, exec, packageJSON, partial }) => ({ dialect }) => {
  if (!supportedDialects.includes(dialect)) {
    throw new Error(`Unsupported dialect ${dialect}, must be one of: [${supportedDialects.join(', ')}]`);
  }

  const configPath = 'src/config.js';
  const config = read(configPath);
  if (/[^ ]  db:/.test(config)) {
    throw new Error('Database already initialized');
  }

  partial('src/config-db.js.partial', configPath, '};', true, { dialect });

  const package = packageJSON();
  package.scripts['migration:create'] = 'node src/cli.js migration:create';
  package.scripts['migration:up'] = 'node src/cli.js migration:up';
  package.scripts['migration:down'] = 'node src/cli.js migration:down';
  package.scripts['migration:test'] = 'node src/cli.js migration:test';
  packageJSON(package);

  const missingDependencies = dependencies[dialect].filter((dep) => !package.dependencies[dep]);
  if (missingDependencies.lenght) {
    exec('npm', 'i', ...missingDependencies);
  }

  mkdirp('src/infrastructure/migrations');
  mkdirp('src/infrastructure/models');
};
