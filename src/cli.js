#!/usr/bin/env node

const BaseApp = require('./');

const InitCommand = require('./cli/commands/init-project');

const CreateUseCase = require('./cli/commands/create-use-case');
const CreateClient = require('./cli/commands/create-client');
const CreateService = require('./cli/commands/create-service');

const registerInitOnly = (cli) => cli.register({
  name: 'init',
  description: 'Sets up a new skeleton app in the current directory',
  exec: InitCommand,
});

const registerCommands = (cli, project) => {
  const enablePackages = {
    api: {
      args: ['port=3000'],
      description: 'Setup a REST API server',
    },
    db: {
      args: ['dialect'],
      description: 'Setup a database connection',
    },
    auth: {
      args: ['algo', 'header=Auth-Token'],
      description: 'Setup user authorization',
    },
    mq: {
      args: ['vendor'],
      description: 'Setup a message queue connection',
    },
  };

  const createComponents = {
    'use-case': CreateUseCase,
    client: CreateClient,
    service: CreateService,
  };

  Object.keys(enablePackages)
    .filter((key) => !project.packages.includes(`node-base-${key}`))
    .forEach((key) => cli.register({
      name: `enable:${key}`,
      exec(args, { addPackage }) { addPackage(`node-base-${key}`, false, args); },
      ...enablePackages[key],
    }));

  Object.keys(createComponents)
    .forEach((key) => cli.register({
      name: `create:${key}`,
      args: ['name'],
      description: `Create a new ${key}`,
      exec: createComponents[key],
    }));
};

(async (app) => {
  const { Core: { Project } } = await app.resolveDependencies(['Core']);
  try {
    const App = require(Project.rootPath);
    const Config = require(Project.configPath);
    const realApp = App(Config);
    await realApp.start();
    app = realApp;
  } catch (_) {
    await app.start();
  }

  const { Core: { Cli } } = await app.resolveDependencies(['Core']);

  if (Project.initialized) {
    registerCommands(Cli, Project);
  } else {
    registerInitOnly(Cli);
  }

  const [,, cmd, ...args] = process.argv;
  try {
    await Cli.run(cmd, ...args);
  } catch (e) {
    console.error(e.message);
    console.log(Cli.usage(cmd));
    process.exit(1);
  }
})(BaseApp({}));
