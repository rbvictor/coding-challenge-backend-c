/**
 * @file Helper containing function `unaccent(str)`
 */

module.exports.unaccent = unaccent;

/**
 * @description Function that removes diacritics from a string
 * @param {string} str
 * @returns {string}
 */
function unaccent(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
}
