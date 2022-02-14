/**
 * @param {Object} context
 * @param {Object.<string, Object>} context.Util
 * @param {Object.<string, Object>} context.Core
 * @param {Object.<string, Object>} context.Client
 * @param {Object.<string, Object>} context.Model
 * @param {Object.<string, (...arg: any) => void>} context.Log
 */
module.exports = ({ Core: { Config } }) => {
  const isAllowed = (code) => Config.__name__.allowed.includes(code);

  const isValid = (code) => (typeof code === 'number' && code > 0);

  const assert = (code) => {
    if (!isValid(code)) {
      throw new Error(`#${code} is not valid`);
    }
    if (!isAllowed(code)) {
      throw new Error(`#${code} is not allowed`);
    }
  };

  return {
    isAllowed,
    isValid,
    assert,
  };
};
