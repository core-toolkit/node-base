class Controller {
  constructor() {
    const prototype = Object.getPrototypeOf(this);
    Object.getOwnPropertyNames(prototype)
      .filter(prop => typeof this[prop] === 'function' && prop !== 'constructor')
      .forEach(method => (this[method] = this[method].bind(this)));
  }
}

module.exports = Controller;
