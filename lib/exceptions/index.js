'use strict';

class CustomException extends Error {
  constructor(message) {
    this[Symbol.toStringTag] = 'Exception';
    super(message || this.defaultMessage);
  }
}

class NotImplementedException extends CustomException {
  constructor(message) {
    this.defaultMessage = 'This functionality is not implemented yet.';
    super(message);
  }
}

class InvalidInitialization extends CustomException {
  constructor(message) {
    this.defaultMessage = 'This initialization process is invalid.';
    super(message);
  }
}

class BadRequest extends CustomException {
  constructor(message) {
    this.defaultMessage = 'This request has bad parameters.';
    super(message);
  }
}

module.exports = {
  CustomException: CustomException,
  NotImplementedException: NotImplementedException,
  InvalidInitialization: InvalidInitialization,
  BadRequest: BadRequest
};
