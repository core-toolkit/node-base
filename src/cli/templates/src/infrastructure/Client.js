/**
 * @param {Object} context
 * @param {Object.<string, Object>} context.Util
 * @param {Object.<string, Object>} context.Core
 * @param {Object.<string, (...arg: any) => void>} context.Log
 * @returns {Object.<string, Function>}
 */
module.exports = ({ Core: { Config, ApiClient } }) => {
  const client = ApiClient(Config.__name__Client.apiBaseUrl);

  return {
    create: (name, value) => client({ url: '/item', method: 'POST', data: { name, value } }),
    fetch: (id) => client({ url: '/item', method: 'GET', data: { id } }),
  };
};
