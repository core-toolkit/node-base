const express = require('express');
const { METHODS } = require('http');
const methods = METHODS.map(method => method.toLowerCase()).concat('all');

const ApiMiddleware = require('./ApiMiddleware');
const Errors = require('./Errors');

const AuthMiddleware = require('./AuthMiddleware');
const Middlewares = {
  AuthMiddleware,
};

const wrap = (handler, processor) => async (...args) => {
  args[1].Errors = Errors;

  try {
    const data = await handler(...args);
    processor({ data }, ...args);
  } catch (error) {
    processor({ error }, ...args);
  }
};

const Router = (processor = ApiMiddleware, useFallback = true) => {
  const rootRouter = express.Router();
  const routesRouter = express.Router();

  rootRouter.use(express.json());
  rootRouter.use(routesRouter);
  routesRouter.Middlewares = Middlewares;

  if (useFallback) {
    rootRouter
      .use((req, res, next) => next(new Errors.NotFound()))
      .use((error, req, res, next) => ApiMiddleware({ error }, req, res, next));
  }

  return new Proxy(rootRouter, {
    get(_, prop, proxy) {
      if (prop === 'sub') {
        return (path) => {
          const sub = Router(processor, false);
          routesRouter.use(path, sub);
          return sub;
        };
      }

      if (!methods.includes(prop)) {
        return routesRouter[prop];
      }

      return (path, ...middleware) => {
        const lastIndex = middleware.length - 1;
        if (typeof middleware[lastIndex] === 'function' && middleware[lastIndex].length < 4) {
          middleware[lastIndex] = wrap(middleware[lastIndex], processor);
        }

        routesRouter[prop](path, ...middleware);
        return proxy;
      };
    },
  });
};

module.exports = Router;
