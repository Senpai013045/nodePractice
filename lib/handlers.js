//dependencies
const helpers = require("./helpers");
const _data = require("./data");

//handlers

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
            hashedPassword,
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
//phone is required
//@TODO only let authenticated users access their own objects later. Dont let them access anyone else's.
handlers._users.get = function (dataReceived, callbackStatusCodeAndData) {
  //check if phone number is valid
  const phone =
    typeof dataReceived.searchParams.get("phone") === "string" &&
    dataReceived.searchParams.get("phone").trim().length === 10
      ? dataReceived.searchParams.get("phone").trim()
      : false;

  //if it is valid ,lookup the user
  if (phone) {
    _data.read("users", phone, (err, data) => {
      //if no error but data exits, removed the hashed password from the user object before sending
      if (!err && data) {
        delete data.hashedPassword;
        callbackStatusCodeAndData(200, data);
      } else {
        callbackStatusCodeAndData(400, { message: "User not found" });
      }
    });
  } else {
    callbackStatusCodeAndData(400, { message: "Invalid phone field" });
  }
};

//requires phone
//optional ,at least one field required
//@TODO only let authenticated users update their own data
handlers._users.put = function (dataReceived, callbackStatusCodeAndData) {
  const info = dataReceived.payload;
  //check for required phone field
  const phoneNumber =
    typeof info.phoneNumber === "string" &&
    info.phoneNumber.trim().length === 10
      ? info.phoneNumber.trim()
      : false;

  //check optional datta
  const firstName =
    typeof info.firstName === "string" && info.firstName.trim().length > 0
      ? info.firstName.trim()
      : false;

  const lastName =
    typeof info.lastName === "string" && info.lastName.trim().length > 0
      ? info.lastName.trim()
      : false;

  const password =
    typeof info.password === "string" && info.password.trim().length > 0
      ? info.password.trim()
      : false;

  //if phone is valid
  if (phoneNumber) {
    //if at least one data is present

    if (firstName || lastName || password) {
      _data.read("users", phoneNumber, (err, data) => {
        if (!err && data) {
          //if fname/update fname

          if (firstName) {
            data.firstName = firstName;
          }

          //if lname/update lname

          if (lastName) {
            data.lastName = lastName;
          }
          //if pwd /update pwd with hash
          if (password) {
            const hashedPassword = helpers.hash(password);
            data.hashedPassword = hashedPassword;
          }
          //store the new data
          _data.update("users", phoneNumber, data, (err) => {
            if (!err) {
              callbackStatusCodeAndData(200);
            } else {
              callbackStatusCodeAndData(500, "Could not update user");
            }
          });
        } else {
          callbackStatusCodeAndData(400, { message: "User does not exist" });
        }
      });
    } else {
      callbackStatusCodeAndData(400, { message: "Missing fields to update" });
    }
  } else {
    callbackStatusCodeAndData(400, { message: "Phone field is not valid" });
  }
};

// Required data: phone
// @TODO Only let an authenticated user delete their object. Dont let them delete update elses.
// @TODO Cleanup (delete) any other data files associated with the user
handlers._users.delete = function (dataReceived, callbackStatusCodeAndData) {
  //checking is phoneNumber is valid
  const phone =
    typeof dataReceived.searchParams.get("phone") === "string" &&
    dataReceived.searchParams.get("phone").trim().length === 10
      ? dataReceived.searchParams.get("phone").trim()
      : false;

  if (phone) {
    _data.read("users", phone, (err, data) => {
      if (!err && data) {
        _data.delete("users", phone, (error) => {
          if (!error) {
            callbackStatusCodeAndData(200);
          } else {
            callbackStatusCodeAndData(500, {
              message: "Could not delete the user",
            });
          }
        });
      } else {
        callbackStatusCodeAndData(400, { message: "User not found" });
      }
    });
  } else {
    callbackStatusCodeAndData(400, { message: "Invalid phone field" });
  }
};

/**
 *Tokens handler
 * @param {object} dataReceived {phone,name,...}
 * @param {function} callbackStatusCodeAndData Function that calls back status code and data
 */
handlers.tokens = function (dataReceived, callbackStatusCodeAndData) {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.includes(dataReceived.method)) {
    handlers._tokens[dataReceived.method](
      dataReceived,
      callbackStatusCodeAndData
    );
  } else {
    callbackStatusCodeAndData(405);
  }
};

/**Private Tokens handler */
handlers._tokens = {};

/**requires phone and password */
handlers._tokens.post = function (dataReceived, callbackStatusCodeAndData) {
  const info = dataReceived.payload;

  const phoneNumber =
    typeof info.phoneNumber === "string" &&
    info.phoneNumber.trim().length === 10
      ? info.phoneNumber.trim()
      : false;

  const password =
    typeof info.password === "string" && info.password.trim().length > 0
      ? info.password.trim()
      : false;

  if (phoneNumber && password) {
    /**Lookup user via phone number */
    _data.read("users", phoneNumber, (error, userInfo) => {
      if (!error && userInfo) {
        //check with hashed password
        const hashedPassword = helpers.hash(password);
        if (hashedPassword) {
          if (hashedPassword === userInfo.hashedPassword) {
            const tokenId = helpers.createRandomString(20);

            if (tokenId) {
              const expires = Date.now() + 60 * 60 * 1000;

              const tokenObject = {
                phoneNumber,
                tokenId,
                expires,
              };

              //store the token
              _data.create("tokens", tokenId, tokenObject, (err) => {
                if (!err) {
                  callbackStatusCodeAndData(200, tokenObject);
                } else {
                  callbackStatusCodeAndData(500, {
                    message: "Could not store token",
                  });
                }
              });
            } else {
              callbackStatusCodeAndData(500, {
                message: "Could not create token",
              });
            }
          } else {
            callbackStatusCodeAndData(400, {
              message: "Password didn't match the specified user's password",
            });
          }
        } else {
          callbackStatusCodeAndData(500, {
            message: "Couldnot hash the given password",
          });
        }
      } else {
        callbackStatusCodeAndData(400, { message: "User not found" });
      }
    });
  } else {
    callbackStatusCodeAndData(400, { message: "Invaid required fields" });
  }
};
handlers._tokens.get = function (dataReceived, callbackStatusCodeAndData) {
  callbackStatusCodeAndData(400);
};
handlers._tokens.put = function (dataReceived, callbackStatusCodeAndData) {
  callbackStatusCodeAndData(400);
};
handlers._tokens.delete = function (dataReceived, callbackStatusCodeAndData) {
  callbackStatusCodeAndData(400);
};

module.exports = handlers;
