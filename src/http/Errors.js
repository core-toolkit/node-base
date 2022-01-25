const express = require("express");

class BaseError extends Error {
  code = 500;
}

class Validation extends BaseError {
  code = 400;
  validations = [];

  constructor() {
    super('Validation error');
  }

  get invalid() {
    return !!this.validations.length;
  }

  add(field, reason = 'Invalid value', hint = undefined) {
    this.validations.push({ field, reason, hint });
  }
}

class Unauthorized extends BaseError {
  code = 401;

  constructor() {
    super('Unauthorized');
  }
}

class Forbidden extends BaseError {
  code = 403;

  constructor() {
    super('Access denied');
  }
}

class NotFound extends BaseError {
  code = 404;

  constructor(item = 'Resource') {
    super(`${item} not found`);
  }
}

module.exports = {
  BaseError,

  Validation,
  Unauthorized,
  Forbidden,
  NotFound,
}
