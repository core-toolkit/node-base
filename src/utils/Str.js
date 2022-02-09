/**
 * @param {String} str
 * @param {String|RegExp} search
 * @param {Boolean} after
 * @returns {Number}
 */
exports.firstIndexOf = (str, search, after = false) => {
  if (search instanceof RegExp) {
    const flags = search.flags.replace('g', '');
    const match = str.match(RegExp(search, flags));
    return match ? match.index + (after ? match[0].length : 0) : -1;
  }

  let index = str.indexOf(search);
  if (after && index > -1) {
    index += search.length;
  }
  return index;
};

/**
 * @param {String} str
 * @param {String|RegExp} search
 * @param {Boolean} after
 * @returns {Number}
 */
 exports.lastIndexOf = (str, search, after = false) => {
  if (search instanceof RegExp) {
    const flags = search.flags.concat('g').split('').filter((v, i, a) => a.indexOf(v) === i).join('');
    const match = [...str.matchAll(RegExp(search, flags))].pop();
    return match ? match.index + (after ? match[0].length : 0) : -1;
  }

  let index = str.lastIndexOf(search);
  if (after && index > -1) {
    index += search.length;
  }
  return index;
};

/**
 * @param {String} str
 * @param {Object.<string, String>} replacements
 * @returns {String}
 */
exports.replaceTokens = (str, replacements, tokenStart = '__', tokenEnd = '__') => {
  return Object.keys(replacements).reduce((out, key) => {
    return out.replaceAll(`${tokenStart}${key}${tokenEnd}`, replacements[key]);
  }, str);
};

/**
 * @param {String} str
 * @returns {String[]}
 */
exports.tokens = (str, tokenStart = '__', tokenEnd = '__') => {
  [tokenStart, tokenEnd] = [tokenStart, tokenEnd].map((str) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const matches = [...str.matchAll(`${tokenStart}((?:(?!${tokenEnd}).)+)${tokenEnd}`)];
  return matches.map(([, v]) => v).filter((v, i, a) => a.indexOf(v) === i);
};
