//helper functions
//dependencies
const crypto = require("crypto");
const config = require("./config");

const helpers = {};

//hashing SHA256
helpers.hash = function (str) {
  if (typeof str === "string" && str.length > 0) {
    const hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

//parse json even when error occurs
helpers.parseJson = function (str) {
  try {
    const parsed = JSON.parse(str);
    return parsed;
  } catch (err) {
    return {};
  }
};

/**
 * Random number generator
 * @param {number} min
 * @param {number} max
 * @returns {number} Integer between min and max included
 */
helpers.getRandomIntegerBetween = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**Creates a random string of given length
 * @param {number} length
 * @returns {string | false }
 */
helpers.createRandomString = function (length) {
  const stringLength =
    typeof length === "number" && length > 0 ? length : false;

  if (stringLength) {
    const possibleCharacters = "abcdefghijklmnopqrstuvwxyz1234567890";
    let str = "";
    for (let i = 1; i <= stringLength; i++) {
      const randomChar = possibleCharacters.charAt(
        helpers.getRandomIntegerBetween(0, possibleCharacters.length - 1)
      );
      str += randomChar;
    }
    return str;
  } else {
    return false;
  }
};

module.exports = helpers;
