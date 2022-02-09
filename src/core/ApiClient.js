/**
 * @typedef {Object.<string, string>} Option
 *
 * @typedef Options
 * @property {String?} url
 * @property {String?} method
 * @property {(Option|Object)?} data
 * @property {String?} baseURL
 * @property {Option?} headers
 *
 * @typedef HttpResponseError
 * @property {String} message
 *
 * @typedef HttpResponse
 * @property {any|null} data
 * @property {HttpResponseError|null} error
 *
 * @typedef ClientResponse
 * @property {HttpResponse} data
 * @property {Number} status
 * @property {string} statusText
 * @property {Option} headers Response headers
 * @property {ClientRequest} request
 * @property {Options} config
 *
 * @typedef ClientErrorType
 * @property {ClientResponse} response
 * @property {ClientRequest} request
 * @property {Options} config
 *
 * @typedef {Error & ClientErrorType} ClientError
 *
 * @callback Client
 * @param {Options} options
 * @returns {Promise<ClientResponse>}
 * @throws {Promise<ClientError>}
 *
 * @typedef {(options: Options) => Promise<ClientResponse>} ApiClient
 * @typedef {(baseURL: string, extraHeaders: Option, extraOptions: Options) => ApiClient} MakeApiClient
 *
 * @param {Client} request
 * @returns {MakeApiClient}
 */
module.exports = (request) => (baseURL, extraHeaders = {}, extraOptions = {}) => (options) => {
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  return request({
    baseURL,
    ...extraOptions,
    ...options,
    headers,
  }).then(({ data }) => data?.data).catch(error => {
    const responseError = error.response?.data?.error;
    throw responseError || error;
  });
};
