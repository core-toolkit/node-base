const assert = require('assert');

/**
 * @typedef Component
 * @typedef {Object.<string, Component>} Type
 * @typedef {Object.<string, Type>} TypeCollection
 */

module.exports = () => {
  const App = {
    registrations: {},
    components: {},
    types: {},
    globalMiddleware: [],
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
   * @param {String} component
   * @param {String} fromType
   * @returns {Promise<Component>}
   */
  const initComponent = async (component) => {
    const [type, name] = component.split('.');
    const types = App.types[type].params.filter((param) => param !== type);
    const context = await resolveDependencies(types);
    if (App.types[type].params.includes(type)) {
      context[type] = {};
      for (const component of Object.keys(App.components)) {
        const [componentType, name] = component.split('.');
        if (componentType === type) {
          context[type][name] = App.components[component];
        }
      }
    }

    let next = App.registrations[component];
    for (const middleware of App.types[type].middleware) {
      next = await middleware(next, context);
    }
    for (const middleware of App.globalMiddleware) {
      next = await middleware(next, context, type, name);
    }
    return typeof next === 'function' ? next(context) : next;
  }

  /**
   * ['a', 'b'] => {
   *  a: { x: Component<a.x>, y: Component<a.y>, ... },
   *  b: { z: Component<b.z>, ... },
   * }
   * @param {String[]} types
   * @returns {Promise<TypeCollection>}
   */
  const resolveDependencies = async (types) => {
    const obj = {};

    for (const type of types) {
      obj[type] = {};
    }

    for (const component of Object.keys(App.registrations)) {
      const [type, name] = component.split('.');
      if (type in obj) {
        if (!(component in App.components)) {
          App.components[component] = await initComponent(component);
        }
        obj[type][name] = App.components[component];
      }
    }

    return obj;
  };

  /**
   * @returns {Promise<TypeCollection>}
   */
  const resolveAll = () => resolveDependencies(getTypes());

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
   * @param {(next: Function, app: TypeCollection, type: String) => Function} middleware
   */
  const addMiddleware = (middleware) => {
    assertTypeof('Middleware', middleware, 'function');
    App.globalMiddleware.push(middleware);
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
   * @param {String} type
   * @param {String} name
   * @param {(params: TypeCollection) => (Component|Promise<Component>)} makeFn
   */
  const register = (type, name, makeFn) => {
    assertType(type);

    const component = `${type}.${name}`;
    assertAvailable(type, component, App.registrations);

    App.registrations[component] = makeFn;
  };

  const initAll = () => resolveDependencies(getTypes());

  const start = async () => {
    assert(!App.running, 'Application is already running');
    App.running = true;
    await initAll();
  };

  return {
    resolveDependencies,
    initAll,
    registerType,
    addMiddleware,
    appendTypeParameters,
    addTypeMiddleware,
    getTypes,
    register,
    start,
  };
};
