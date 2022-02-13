const assert = require('assert');

/**
 * @typedef Component
 * @typedef {Object.<string, Component>} Type
 * @typedef {Object.<string, Type>} TypeCollection
 */

module.exports = () => {
  const App = {
    components: {},
    types: {},
    running: false,
  };

  const assertType = (type, name = 'type') => assert(type in App.types, `Unknown ${name} "${type}"`);
  const assertAvailable = (name, key, obj) => assert(!(key in obj), `Cannot register ${name} "${key}" as it already exists`);
  const assertTypeof = (name, obj, type) => {
    const objType = typeof obj;
    assert(objType === type, `${name} must be of type "${type}", got "${objType}"`);
  };
  const assertNoCyclical = (target, dependency) => {
    const remaining = Object.keys(App.types);
    while (remaining.length) {
      const candidates = [];
      for (const type of remaining) {
        const requirements = App.types[type].params.slice();
        if (type === target) {
          requirements.push(dependency);
        }
        const unmet = requirements.filter((param) => param !== type && remaining.includes(param));
        if (!unmet.length) {
          candidates.push(type);
        }
      }

      candidates.forEach((type) => remaining.splice(remaining.indexOf(type), 1));
      assert(candidates.length, 'Cyclical dependency detected!');
    }
  };

  /**
   * ['a', 'b'] => {
   *  a: { x: Component<a.x>, y: Component<a.y>, ... },
   *  b: { z: Component<b.z>, ... },
   * }
   * @param {String[]} types
   * @param {String} skip
   * @returns {Promise<TypeCollection>}
   */
  const resolveDependencies = async (types) => {
    const obj = {};

    for (const type of types) {
      obj[type] = {};
    }

    for (const component of Object.keys(App.components)) {
      const [type, name] = component.split('.');
      if (type in obj) {
        obj[type][name] = await App.components[component];
      }
    }

    return obj;
  };

  /**
   * @param {String} type
   * @param  {...String} params
   */
  const appendTypeParameters = (type, ...params) => {
    assertType(type);

    for (const param of params) {
      assertTypeof('Type parameters', param, 'string');
      assertType(param, 'type parameter');
      assertNoCyclical(type, param);
    }

    App.types[type].params.push(...params);
  };

  /**
   * @param {String} type
   * @param  {...String} params
   */
  const registerType = (type, ...params) => {
    assertAvailable('type', type, App.types);

    App.types[type] = { params: [], middleware: [] };

    appendTypeParameters(type, ...params);
  };

  /**
   * @param {String} type
   * @param {(next: Function, app: TypeCollection) => Function} middleware
   */
  const addTypeMiddleware = (type, middleware) => {
    assertType(type);
    assertTypeof('Middleware', middleware, 'function');
    App.types[type].middleware.push(middleware);
  };

  /**
   * @returns {String[]}
   */
  const getTypes = () => {
    const out = [];
    const remaining = Object.keys(App.types);

    while (remaining.length) {
      const candidates = [];
      for (const type of remaining) {
        const requirements = App.types[type].params.filter((param) => param !== type && remaining.includes(param));
        if (!requirements.length) {
          candidates.push(type);
        }
      }

      candidates.forEach((type) => remaining.splice(remaining.indexOf(type), 1));
      out.push(...candidates.sort());
    }
    return out;
  };

  /**
   * @param {String} type
   * @param {String} name
   * @param {(params: TypeCollection) => (Component|Promise<Component>)} makeFn
   */
  const register = (type, name, makeFn) => {
    assertType(type);

    const component = `${type}.${name}`;
    assertAvailable(type, component, App.components);

    App.components[component] = resolveDependencies(App.types[type].params).then(async (params) => {
      let next = makeFn;
      for (const middleware of App.types[type].middleware) {
        next = await middleware(next, params);
      }
      return typeof next === 'function' ? next(params) : next;
    });
  };

  const initAll = () => Promise.all(Object.values(App.components)).then(() => { });

  const start = async () => {
    assert(!App.running, 'Application is already running');
    App.running = true;
    await initAll();
  };

  return {
    resolveDependencies,
    initAll,
    registerType,
    appendTypeParameters,
    addTypeMiddleware,
    getTypes,
    register,
    start,
  };
};
