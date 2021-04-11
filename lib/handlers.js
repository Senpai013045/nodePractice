//handlers

//dependencies
const helpers = require("./helpers");
const _data = require("./data");

var handlers = {};

//sample handler
handlers.sample = function (data, callback) {
  //pass in an ananymous function and it will inject stuffs that we can pass from here
  const statusCode = 406;
  const payload = { name: "Subham", course: "Node js masterclass" };
  //callback injects a statuscode and payload
  callback(statusCode, payload);
};

//ping handler
handlers.ping = function (data, callback) {
  const statusCode = 200;
  const payload = { message: "pong" };
  callback(statusCode, payload);
};

//not found handler
handlers.notFound = function (data, callback) {
  //callback a 404
  const statusCode = 404;
  callback(statusCode);
};

// const dataReceived = {
//   trimmedPath,
//   searchParams,
//   method,
//   payload,
// };

//callback is (statuscode,<data to be sent back/pure objects/or dont send at all>)
//users handler main//this calls its sub-methods
handlers.users = function (dataReceived, callbackStatusCodeAndData) {
  const acceptableMethods = ["get", "post", "put", "delete"];
  if (acceptableMethods.includes(dataReceived.method)) {
    handlers._users[dataReceived.method](
      dataReceived,
      callbackStatusCodeAndData
    );
  } else {
    callbackStatusCodeAndData(405);
  }
};

handlers._users = {};

//submethods(private) of handlers.users
handlers._users.post = function (dataReceived, callbackStatusCodeAndData) {
  //validate all the required fields
  const info = dataReceived.payload;

  const firstName =
    typeof info.firstName === "string" && info.firstName.trim().length > 0
      ? info.firstName.trim()
      : false;

  const lastName =
    typeof info.lastName === "string" && info.lastName.trim().length > 0
      ? info.lastName.trim()
      : false;

  const phoneNumber =
    typeof info.phoneNumber === "string" &&
    info.phoneNumber.trim().length === 10
      ? info.phoneNumber.trim()
      : false;

  const password =
    typeof info.password === "string" && info.password.trim().length > 0
      ? info.password.trim()
      : false;

  const tosAgreement =
    typeof info.tosAgreement === "boolean" && info.tosAgreement === true
      ? true
      : false;

  //check all fields are valid
  if (firstName && lastName && phoneNumber && password && tosAgreement) {
    _data.read("users", phoneNumber, (err, data) => {
      if (err) {
        //if error meaning user doesn't exist
        const hashedPassword = helpers.hash(password);
        //password hashing
        if (hashedPassword) {
          const userDetails = {
            firstName,
            lastName,
            phoneNumber,
            tosAgreement,
            password: hashedPassword,
          };

          _data.create("users", phoneNumber, userDetails, (err) => {
            if (!err) {
              callbackStatusCodeAndData(200, {
                message: "User created successfully",
              });
            } else {
              callbackStatusCodeAndData(500, {
                message: "Could not create the new user",
              });
            }
          });
        } else {
          callbackStatusCodeAndData(500, {
            message: "Could not hash the user's password",
          });
        }
      } else {
        callbackStatusCodeAndData(400, {
          message: "A user with that phone number already exists",
        });
      }
    });
  } else {
    callbackStatusCodeAndData(400, {
      message: "Invalid or missing required fields",
    });
  }
};
handlers._users.get = function (dataReceived, callbackStatusCodeAndData) {
  callbackStatusCodeAndData(400);
};
handlers._users.put = function (dataReceived, callbackStatusCodeAndData) {
  callbackStatusCodeAndData(400);
};
handlers._users.delete = function (dataReceived, callbackStatusCodeAndData) {
  callbackStatusCodeAndData(400);
};

module.exports = handlers;
