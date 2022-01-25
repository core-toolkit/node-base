const { Sequelize } = require('sequelize');

module.exports = (username, password, host, database, dialect) => new Sequelize({
  username,
  password,
  host,
  database,
  dialect,
});
