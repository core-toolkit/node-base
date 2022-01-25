const axios = require('axios');

module.exports = (baseURL, extraHeaders = {}, extraOptions = {}) => (options) => {
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  return axios({
    baseURL,
    ...extraOptions,
    ...options,
    headers,
  }).then(({ data }) => data.data).catch(error => {
    const responseError = error.response?.data?.error;
    throw responseError || error;
  });
};
