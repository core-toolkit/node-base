const MakeCli = require('./core/cli');

const HttpClient = require('./clients/HttpClient');
const MakeDbClient = require('./clients/DbClient');

const ApiServer = require('./http/ApiServer');
const Router = require('./http/Router');
const UserTokenMiddleware = require('./http/UserTokenMiddleware');

const MakeAuthService = require('./services/AuthService');
const CacheService = require('./services/CacheService');
const LoggerService = require('./services/LoggerService');
const MakeMigrator = require('./services/migration');

const MakeModel = require('./Model');

/**
 * @typedef AppCore
 * @property {MakeCli} Cli
 *
 * @typedef AppClients
 * @property {MakeDbClient?} DbClient
 *
 * @typedef AppServices
 * @property {LoggerService} LoggerService
 * @property {CacheService} CacheService
 * @property {MakeAuthService?} AuthService
 * @property {MakeMigrator?} MigrationService
 *
 * @typedef DbConfig
 * @property {String} username
 * @property {String} password
 * @property {String} host
 * @property {String} database
 * @property {String} dialect
 *
 * @typedef AuthConfig
 * @property {String} header
 * @property {String} pubKey
 * @property {String} algorithm
 *
 * @typedef Config
 * @property {DbConfig?} db
 * @property {AuthConfig?} auth
 * @property {String|Number} port
 *
 * @typedef MakeClientParams
 * @property {Config} Config
 * @property {HttpClient} httpClient
 *
 * @callback MakeClient
 * @param {MakeClientParams} params
 *
 * @typedef MakeServiceParams
 * @property {Config} Config
 * @property {AppCore} Core
 * @property {AppClients} Clients
 * @property {Object.<string, Model>} Models
 *
 * @callback MakeService
 * @param {MakeServiceParams} params
 *
 * @callback MakeController
 * @param {Object.<string, any>} useCases
 *
 * @callback MakeModel
 * @param {DataTypes} dataTypes
 * @returns {ModelDefinition}
 *
 * @typedef MakeuseCaseParams
 * @property {AppClients} Clients
 * @property {Object.<string, Model>} Models
 * @property {AppServices} Services
 * @param {Object.<string, any>} useCases
 *
 * @callback MakeUseCase
 * @param {MakeuseCaseParams} params
 *
 * @callback ApplyRoute
 * @param {Router} router
 * @param {AppControllers} controllers
 *
 * @typedef ApplicationInterface
 * @property {(name: string, makeFn: MakeClient) => void} RegisterClient
 * @property {(name: string, makeFn: MakeService) => void} RegisterService
 * @property {(name: string, makeFn: MakeController) => void} RegisterController
 * @property {(name: string, makeFn: MakeModel) => void} RegisterModel
 * @property {(name: string, makeFn: MakeUseCase) => void} RegisterUseCase
 * @property {(applyFn: ApplyRoute) => void} RegisterRoutes
 * @property {Function} StartServer
 * @property {Function} StartCli
 *
 * @param {Config} Config
 * @returns {ApplicationInterface}
 */
module.exports = (Config) => {
  const App = {
    Config,
    Core: {
      Cli: MakeCli(),
    },
    Clients: {},
    Models: {},
    Services: {
      LoggerService,
      CacheService: CacheService(),
    },
    Controllers: {},
    UseCases: {},
  };

  if (Config.db) {
    App.Clients.DbClient = MakeDbClient(Config.db);
    App.Services.MigrationService = MakeMigrator(App.Clients.DbClient, App.Core.Cli);
  }

  const router = Router();

  if (Config.auth) {
    App.Services.AuthService = MakeAuthService(Config.auth.pubKey, Config.auth.algorithm);
    const tokenMiddleware = UserTokenMiddleware(Config.auth.header, App.Services.AuthService.parse);
    router.use(tokenMiddleware);
  }

  const StartApiServer = ApiServer(router, Config.port, LoggerService);

  const register = (type, name, obj) => {
    if (!App[type]) {
      App[type] = {};
    }
    if (name in App[type]) {
      throw new Error(`Cannot register ${type}::${name} as it already exists`);
    }
    App[type][name] = obj;
  };

  let running = false;
  return {
    RegisterClient(name, makeFn) {
      const client = makeFn(App.Config, HttpClient);
      register('Clients', name, client);
    },
    RegisterModel(name, makeFn) {
      const model = MakeModel(makeFn, App.Clients.DbClient);
      register('Models', name, model);
    },
    RegisterService(name, makeFn) {
      const service = makeFn({ Config: App.Config, Core: App.Core, Clients: App.Clients, models: App.Models });
      register('Services', name, service);
    },
    RegisterUseCase(name, makeFn) {
      const useCase = makeFn({ Clients: App.Clients, Models: App.Models, Services: App.Services, UseCases: App.UseCases });
      register('UseCases', name, useCase);
    },
    RegisterController(name, makeFn)  {
      const controller = makeFn(App.UseCases);
      register('Controllers', name, controller);
    },
    RegisterRoutes: (applyFn) => applyFn(router, App.Controllers),
    StartServer: async () => {
      if (running) {
        throw new Error('Application is already running');
      }
      running = true;
      if (App.Services.MigrationService) {
        await App.Services.MigrationService.up();
      }
      StartApiServer();
    },
    StartCli: () => {
      if (running) {
        throw new Error('Application is already running');
      }
      running = true;
      App.Core.Cli.start();
    },
  };
};
