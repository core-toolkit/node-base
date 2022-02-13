/**
 * @param {Object} context
 * @param {Object.<string, Object>} context.Util
 * @param {Object.<string, Object>} context.Core
 * @returns
 */
module.exports = ({ Core: { Config, ApiClient } }) => {
  const client = ApiClient(Config.__name__ApiBaseUrl);

  return {
    create: (name, value) => client({ url: '/item', method: 'POST', data: { name, value } }),
    fetch: (id) => client({ url: '/item', method: 'GET', data: { id } }),
  };
};