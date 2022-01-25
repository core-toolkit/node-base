/**
 * @param {String} header
 * @param {(token: String)=>Object} parser
 * @returns {Function} Express middleware
 */
module.exports = (header, parser) => async (req, res, next) => {
  const token = req.get(header);
  req.user = await parser(token);
  next();
};
