const jose = require('jose');
const { createPublicKey } = require('crypto');

/**
 * @param {String} key
 * @param {String} algo
 */
module.exports = (key, algo) => {
  const cert = createPublicKey({
    key: Buffer.from(key, 'base64'),
    type: 'spki',
    format: 'der',
  });

  return {
    /**
     * @param {String} token
     * @returns {Object}
     */
    async parse(token) {
      try {
        const { payload } = await jose.jwtVerify(token, cert, { algorithms: [algo] });
        return payload;
      } catch (_) {
        return {};
      }
    },
  };
};
