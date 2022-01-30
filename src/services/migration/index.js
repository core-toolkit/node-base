const Sequelize = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const { resolve, dirname } = require('path');

const registerCliCommands = require('./cli');

/**
 * @param {Sequelize} sequelize
 * @returns {Umzug}
 */
module.exports = (sequelize, Cli) => {
  const projectRoot = dirname(require.main.filename);
  const migrationsPath = resolve(projectRoot, 'infrastructure', 'migrations');

  const umzug = new Umzug({
    migrations: {
      glob: resolve(migrationsPath, '*.js'),
    },
    context: {
      Sequelize,
      query: sequelize.getQueryInterface(),
    },
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
  });

  registerCliCommands(umzug, migrationsPath, Cli);

  return umzug;
};
