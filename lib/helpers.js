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

module.exports = helpers;
