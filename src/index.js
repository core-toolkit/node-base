const child_process = require('child_process');
const fs = require('fs');
const axios = require('axios');

const Obj = require('./utils/Obj');
const Str = require('./utils/Str');
const Func = require('./utils/Func');

const MakeApp = require('./core/App');
const Project = require('./core/Project');
const Logger = require('./core/Logger');
const ApiClient = require('./core/ApiClient');
const CliInterface = require('./core/CliInterface');
const Cli = require('./core/Cli');

const CacheService = require('./services/CacheService');

/**
 * @param {Object.<string, any>} Config
 * @param  {...(app: T) => T} middleware
 * @returns {MakeApp}
 */
module.exports = (Config, ...middleware) => {
  const app = MakeApp();

  app.registerType('Util');
  app.registerType('Core', 'Util', 'Core');
  app.registerType('Client', 'Util', 'Core');
  app.registerType('Service', 'Util', 'Core', 'Client');
  app.registerType('UseCase', 'Util', 'Core', 'Client', 'Service', 'UseCase');

  app.register('Util', 'Obj', Obj);
  app.register('Util', 'Str', Str);
  app.register('Util', 'Func', Func);

  app.register('Core', 'Config', Config);
  app.register('Core', 'Project', () => Project(process));
  app.register('Core', 'Logger', () => Logger(console));
  app.register('Core', 'ApiClient', () => ApiClient(axios));
  app.register('Core', 'CliInterface', CliInterface(fs, child_process, app.getTypes));
  app.register('Core', 'Cli', Cli);

  app.register('Service', 'CacheService', () => CacheService());

  app.addMiddleware((makeFn, context, _, name) => {
    if (context.Core?.Logger && typeof makeFn === 'function') {
      return (ctx) => makeFn({ ...ctx, Log: context.Core.Logger[name] });
    }
    return makeFn;
  });

  return middleware.reduce((composed, compose) => compose(composed), app);
};
