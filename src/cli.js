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
    .filter((key) => !project.nodeBase.packages.includes(`node-base-${key}`))
    .forEach((key) => cli.register({
      name: `enable:${key}`,
      exec(args, { addBasePackage }) { addBasePackage(`node-base-${key}`, false, args); },
      ...enablePackages[key],
    }));

  Object.keys(createComponents)
    .forEach((key) => cli.register({
      name: `create:${key}`,
      args: ['name'],
      description: `Create a new ${key}`,
      exec: createComponents[key],
    }));

  cli.register({
    name: 'test',
    args: ['[...paths]'],
    description: 'Run the test suite',
    exec({ paths }, { exec }) {
      const { status } = exec('jest', '--detectOpenHandles', ...paths);
      return status;
    },
  })
};

(async (app) => {
  const { Core: { Project } } = await app.resolveDependencies(['Core']);
  try {
    const App = require(Project.rootPath);
    const Config = require(Project.configPath);
    app = App(Config);
  } catch (_) { }
  await app.initAll().catch(() => {});

  const { Core: { Cli } } = await app.resolveDependencies(['Core']);

  if (Project.initialized) {
    registerCommands(Cli, Project);
  } else {
    registerInitOnly(Cli);
  }

  const [,, cmd, ...args] = process.argv;
  try {
    const code = await Cli.run(cmd, ...args);
    process.exit(code);
  } catch (e) {
    if (e instanceof Cli.InvalidInvocation) {
      console.log(Cli.usage(args[0]));
      process.exit(0);
    }
    console.error(e.message);
    console.log(Cli.usage(cmd));
    process.exit(1);
  }
})(BaseApp({}));
