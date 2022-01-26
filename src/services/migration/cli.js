const fs = require('fs');
const { relative, resolve } = require('path');

module.exports = (umzug, migrationsPath, Cli) => Cli.register([
  {
    name: 'migration:create',
    args: ['name'],
    description: 'Creates a new migration',
    exec({ name }) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, '-');

      const date = new Date();
      const dateFormatted = ['FullYear', 'Month', 'Date', 'Hours', 'Minutes', 'Seconds']
        .map((method) => date[`getUTC${method}`]())
        .map((value, i) => (i === 1 ? String(value + 1).padStart(2, '0') : value))
        .join('');

      const template = resolve(__dirname, 'migration-template.js');
      const path = resolve(migrationsPath, `${dateFormatted}-${slug}.js`);
      fs.copyFileSync(template, path);
      console.log(`New migration created at "${relative(process.cwd(), path)}"`);
    },
  },
  {
    name: 'migration:up',
    description: 'Execute all pending migrations',
    exec: () => umzug.up(),
  },
  {
    name: 'migration:down',
    description: 'Revert the last migration',
    exec: () => umzug.down(),
  },
  {
    name: 'migration:test',
    description: 'Tests the consistency of the last migration (up, down, up)',
    exec: async () => {
      await umzug.up();
      await umzug.down();
      await umzug.up();
    },
  },
]);
