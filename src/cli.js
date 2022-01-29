#!/usr/bin/env node

const cli = require('./core/cli')();
const args = require('./cli/args');

const MakeInit = require('./cli/commands/init');
const MakeEnableDb = require('./cli/commands/enable-db');
const MakeEnableAuth = require('./cli/commands/enable-auth');
const MakeCreateController = require('./cli/commands/create-controller');
const MakeCreateRoute = require('./cli/commands/create-route');
const MakeCreateUseCase = require('./cli/commands/create-use-case');

cli.register({
  name: 'init',
  description: 'Sets up a new skeleton app in the current directory',
  exec: MakeInit(args),
});

cli.register({
  name: 'enable:db',
  args: ['dialect'],
  description: 'Setup a database connection',
  exec: MakeEnableDb(args),
});
cli.register({
  name: 'enable:auth',
  args: ['algo', 'header=Auth-Token'],
  description: 'Setup the auth service',
  exec: MakeEnableAuth(args),
});

cli.register({
  name: 'create:controller',
  args: ['name'],
  description: 'Create a new controller',
  exec: MakeCreateController(args),
});
cli.register({
  name: 'create:route',
  args: ['name'],
  description: 'Create a new route',
  exec: MakeCreateRoute(args),
});
cli.register({
  name: 'create:use-case',
  args: ['name'],
  description: 'Create a new use-case',
  exec: MakeCreateUseCase(args),
});

cli.start();
