//helper functions
//dependencies
const crypto = require("crypto");
const config = require("./config");
const querystring = require("querystring");
const https = require("https");

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

/**
 * Sends a sms via twilio to the given number
 * @param {string} phoneNumber The 10 digit phone number in string
 * @param {string} message Message to be sent
 * @param {function} callbackError Function that callsback error
 */
helpers.sendTwilioSms = function (phoneNumber, message, callbackError) {
  //validtion
  phoneNumber =
    typeof phoneNumber === "string" && phoneNumber.trim().length === 10
      ? phoneNumber.trim()
      : false;
  message =
    typeof message == "string" &&
    message.trim().length > 0 &&
    message.trim().length <= 1600
      ? message.trim()
      : false;

  if (phoneNumber && message) {
    //configure payloadObject
    const payloadObject = {
      From: config.twilio.fromPhone,
      To: "+977" + phoneNumber,
      Body: message,
    };

    const stringPayload = querystring.stringify(payloadObject);

    //configure request details

    const requestDetails = {
      protocol: "https:",
      hostname: "api.twilio.com",
      methof: "POST",
      path:
        "/2010-04-01/Accounts/" + config.twilio.accountSid + "/Messages.json",
      auth: config.twilio.accountSid + ":" + config.twilio.authToken,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(stringPayload),
      },
    };

    //instantiate the request
    const req = https.request(requestDetails, (res) => {
      const { statusCode } = res;
      if (statusCode === 200 || statusCode === 201) {
        callbackError(false);
      } else {
        callbackError("Status code " + statusCode + " was returned");
      }
    });

    //bind error to prevent crashing
    req.on("error", (e) => {
      callbackError(e);
    });

    //attach the payload
    req.write(stringPayload);

    //end the request
    req.end();
  } else {
    callbackError("Invalid parameters");
  }
};

module.exports = helpers;
