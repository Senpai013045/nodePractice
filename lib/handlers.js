//@ts-check
//dependencies
const helpers = require("./helpers");
const _data = require("./data");
const config = require("./config");

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
handlers._users.get = function (dataReceived, callbackStatusCodeAndData) {
  //check if phone number is valid
  const phoneNumber =
    typeof dataReceived.searchParams.get("phoneNumber") === "string" &&
    dataReceived.searchParams.get("phoneNumber").trim().length === 10
      ? dataReceived.searchParams.get("phoneNumber").trim()
      : false;

  //if it is valid ,lookup the user
  if (phoneNumber) {
    //get tokens from header
    const tokenId =
      typeof dataReceived.headers.tokenid === "string"
        ? dataReceived.headers.tokenid
        : false;

    //verify token
    handlers._tokens.verifyToken(tokenId, phoneNumber, (tokenIsValid) => {
      if (tokenIsValid) {
        //proceed
        _data.read("users", phoneNumber, (err, data) => {
          //if no error but data exits, removed the hashed password from the user object before sending
          if (!err && data) {
            delete data.hashedPassword;
            callbackStatusCodeAndData(200, data);
          } else {
            callbackStatusCodeAndData(400, { message: "User not found" });
          }
        });
      } else {
        callbackStatusCodeAndData(400, {
          message: "Invalid or missing tokenId in headers",
        });
      }
    });
  } else {
    callbackStatusCodeAndData(400, { message: "Invalid phoneNumber field" });
  }
};

//requires phone
//optional ,at least one field required
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
      const tokenId =
        typeof dataReceived.headers.tokenid === "string"
          ? dataReceived.headers.tokenid
          : false;

      //verify token
      handlers._tokens.verifyToken(tokenId, phoneNumber, (isValid) => {
        if (isValid) {
          //proceed
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
              callbackStatusCodeAndData(400, {
                message: "User does not exist",
              });
            }
          });
        } else {
          callbackStatusCodeAndData(400, {
            message: "Invalid or missing tokenid in headers",
          });
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
  const phoneNumber =
    typeof dataReceived.searchParams.get("phoneNumber") === "string" &&
    dataReceived.searchParams.get("phoneNumber").trim().length === 10
      ? dataReceived.searchParams.get("phoneNumber").trim()
      : false;

  if (phoneNumber) {
    const tokenId =
      typeof dataReceived.headers.tokenid === "string"
        ? dataReceived.headers.tokenid
        : false;
    //verify
    handlers._tokens.verifyToken(tokenId, phoneNumber, (isValid) => {
      if (isValid) {
        _data.read("users", phoneNumber, (err, data) => {
          if (!err && data) {
            _data.delete("users", phoneNumber, (error) => {
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
        callbackStatusCodeAndData(400, {
          message: "Missing or invalid tokenid in the headers",
        });
      }
    });
  } else {
    callbackStatusCodeAndData(400, { message: "Invalid phoneNumber field" });
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
  const tokenId =
    typeof dataReceived.searchParams.get("tokenId") === "string" &&
    dataReceived.searchParams.get("tokenId").trim().length === 20
      ? dataReceived.searchParams.get("tokenId").trim()
      : false;

  if (tokenId) {
    _data.read("tokens", tokenId, (err, data) => {
      if (!err && data) {
        callbackStatusCodeAndData(200, data);
      } else {
        callbackStatusCodeAndData(404);
      }
    });
  } else {
    callbackStatusCodeAndData(400, { message: "Invalid token id" });
  }
};

//put handler
//required data are id and extend

handlers._tokens.put = function (dataReceived, callbackStatusCodeAndData) {
  //get id from payload
  const tokenId =
    typeof dataReceived.payload.tokenId === "string" &&
    dataReceived.payload.tokenId.trim().length === 20
      ? dataReceived.payload.tokenId.trim()
      : false;
  //get extend from the payload
  const extend =
    typeof dataReceived.payload.extend === "boolean" &&
    dataReceived.payload.extend === true
      ? true
      : false;
  //if id and extend exists
  if (tokenId && extend) {
    //read the token
    _data.read("tokens", tokenId, (err, tokenInfo) => {
      //if theres no error and a token exists
      if (!err && tokenInfo) {
        //check if the token hasn't expired
        if (tokenInfo.expires > Date.now()) {
          //if token hasn't expired
          //set the expiration to one hour from now
          tokenInfo.expires = Date.now() + 1000 * 60 * 60;
          //store the new updates
          _data.update("tokens", tokenId, tokenInfo, (error) => {
            if (!error) {
              callbackStatusCodeAndData(200);
            } else {
              callbackStatusCodeAndData(500, {
                message: "Could not update the token's expiration",
              });
            }
          });
        } else {
          callbackStatusCodeAndData(400, {
            message: "Token has already expired and cannot be extended",
          });
        }
      } else {
        callbackStatusCodeAndData(400, { message: "Token does not exist" });
      }
    });
  } else {
    callbackStatusCodeAndData(400, { message: "Invalid required fields" });
  }
};
//delete handler for tokens
//required data is tokenId via searchParams
handlers._tokens.delete = function (dataReceived, callbackStatusCodeAndData) {
  const tokenId =
    typeof dataReceived.searchParams.get("tokenId") === "string" &&
    dataReceived.searchParams.get("tokenId").trim().length === 20
      ? dataReceived.searchParams.get("tokenId").trim()
      : false;

  if (tokenId) {
    _data.read("tokens", tokenId, (err, data) => {
      if (!err && data) {
        _data.delete("tokens", tokenId, (error) => {
          if (!error) {
            callbackStatusCodeAndData(200);
          } else {
            callbackStatusCodeAndData(500, {
              message: "Could not delete specified token",
            });
          }
        });
      } else {
        callbackStatusCodeAndData(400, {
          message: "Couldn't find the specified token",
        });
      }
    });
  } else {
    callbackStatusCodeAndData(400, {
      message: "Invalid tokenId or missing tokenId",
    });
  }
};

/**
 * Returns true or false by conducting a check
 * @param {string} tokenId The token ID to verify
 * @param {string} phoneNumber The phone number to verify against
 * @param {function} callbackIsValid returns true or false
 */
handlers._tokens.verifyToken = function (
  tokenId,
  phoneNumber,
  callbackIsValid
) {
  _data.read("tokens", tokenId, (err, data) => {
    if (!err && data) {
      if (data.phoneNumber === phoneNumber && data.expires > Date.now()) {
        callbackIsValid(true);
      } else {
        callbackIsValid(false);
      }
    } else {
      callbackIsValid(false);
    }
  });
};

/**
 *Main checks handler that calls its private handlers
 * @param {object} dataReceived object that goes into this handler
 * @param {function} callbackStatusCodeAndData function that injects statuscode and data to be sent back (object)
 */
handlers.checks = function (dataReceived, callbackStatusCodeAndData) {
  const acceptableMethods = ["get", "post", "put", "delete"];
  if (acceptableMethods.includes(dataReceived.method)) {
    handlers._checks[dataReceived.method](
      dataReceived,
      callbackStatusCodeAndData
    );
  } else {
    callbackStatusCodeAndData(405);
  }
};

/**
 * Checks handler container
 */
handlers._checks = {};

/**
 *Post handler for checks
 * @param {object} dataReceived object that goes into this handler
 * @param {function} callbackStatusCodeAndData function that injects statuscode and data to be sent back (object)
 */
handlers._checks.post = function (dataReceived, callbackStatusCodeAndData) {
  //grab the protocol from payload
  const protocol =
    typeof dataReceived.payload.protocol === "string" &&
    ["http", "https"].includes(dataReceived.payload.protocol)
      ? dataReceived.payload.protocol
      : false;
  //grab url from payload
  const url =
    typeof dataReceived.payload.url === "string" &&
    dataReceived.payload.url.trim().length > 0
      ? dataReceived.payload.url.trim()
      : false;
  //grab methods
  const method =
    typeof dataReceived.payload.method === "string" &&
    ["post", "get", "put", "delete"].includes(dataReceived.payload.method)
      ? dataReceived.payload.method
      : false;
  //grab success codes
  const successCodes =
    typeof dataReceived.payload.successCodes === "object" &&
    dataReceived.payload.successCodes instanceof Array &&
    dataReceived.payload.successCodes.length > 0
      ? dataReceived.payload.successCodes
      : false;
  //grab timeoutSeconds
  const timeoutSeconds =
    typeof dataReceived.payload.timeoutSeconds === "number" &&
    dataReceived.payload.timeoutSeconds % 1 === 0 &&
    dataReceived.payload.timeoutSeconds >= 1 &&
    dataReceived.payload.timeoutSeconds <= 5
      ? dataReceived.payload.timeoutSeconds
      : false;
  //validate all
  if (protocol && url && method && successCodes && timeoutSeconds) {
    //get token from headers
    const tokenId =
      typeof dataReceived.headers.tokenid === "string"
        ? dataReceived.headers.tokenid
        : false;
    if (tokenId) {
      //lookup token
      _data.read("tokens", tokenId, (err, tokenData) => {
        if (!err && tokenData) {
          //proceed
          const extractedPhoneNumberFromTokenData = tokenData.phoneNumber;
          //lookup the phoneNumber on users
          _data.read(
            "users",
            extractedPhoneNumberFromTokenData,
            (userReadError, userData) => {
              if (!userReadError && userData) {
                //proceed
                //grab checks if it exits from user data else create one
                const checks =
                  typeof userData.checks === "object" &&
                  userData.checks instanceof Array
                    ? userData.checks
                    : [];
                //verify that user is below max checks from config
                if (checks.length < config.maxChecks) {
                  //good to go
                  //create a random checkId
                  const checkId = helpers.createRandomString(20);
                  if (checkId) {
                    //create a checkobject with phone number
                    const checkObject = {
                      checkId,
                      phoneNumber: extractedPhoneNumberFromTokenData,
                      protocol,
                      url,
                      method,
                      successCodes,
                      timeoutSeconds,
                    };
                    //save this in checks
                    _data.create(
                      "checks",
                      checkId,
                      checkObject,
                      (writeCheckError) => {
                        if (!writeCheckError) {
                          //add the check id in the users data
                          userData.checks = checks;
                          checks.push(checkId);
                          //update the users object
                          _data.update(
                            "users",
                            extractedPhoneNumberFromTokenData,
                            userData,
                            (updateUserError) => {
                              if (!updateUserError) {
                                callbackStatusCodeAndData(200, checkObject);
                              } else {
                                callbackStatusCodeAndData(500, {
                                  message:
                                    "Cound not update user data with the new check",
                                });
                              }
                            }
                          );
                        } else {
                          callbackStatusCodeAndData(500, {
                            message: "Could not create the new check",
                          });
                        }
                      }
                    );
                  } else {
                    callbackStatusCodeAndData(500, {
                      message: "An error occurred while creating the checkId",
                    });
                  }
                } else {
                  callbackStatusCodeAndData(400, {
                    message: `The user already has the maximum amount of checks (${config.maxChecks})`,
                  });
                }
              } else {
                callbackStatusCodeAndData(400, {
                  message: "No user found with associated token",
                });
              }
            }
          );
        } else {
          callbackStatusCodeAndData(403, {
            message: "The tokenid provided does not exist",
          });
        }
      });
    } else {
      callbackStatusCodeAndData(400, {
        message: "Did not get tokenid in the headers",
      });
    }
  } else {
    callbackStatusCodeAndData(400, {
      message:
        "Missing or invalid fields (protocol,url,method,successCodes,timeoutSeconds)",
    });
  }
};
/**
 *get handler for checks
 * @param {object} dataReceived object that goes into this handler
 * @param {function} callbackStatusCodeAndData function that injects statuscode and data to be sent back (object)
 */
handlers._checks.get = function (dataReceived, callbackStatusCodeAndData) {
  //get checkId from search parameters
  let checkId = dataReceived.searchParams.get("checkId");
  checkId =
    typeof checkId === "string" && checkId.trim().length === 20
      ? checkId.trim()
      : false;
  if (checkId) {
    //lookup check
    _data.read("checks", checkId, (readCheckError, checkObject) => {
      if (!readCheckError && checkObject) {
        //get token from the header
        const tokenId =
          typeof dataReceived.headers.tokenid === "string" &&
          dataReceived.headers.tokenid.trim().length === 20
            ? dataReceived.headers.tokenid.trim()
            : false;
        if (tokenId) {
          //verify
          handlers._tokens.verifyToken(
            tokenId,
            checkObject.phoneNumber,
            (isValid) => {
              if (isValid) {
                callbackStatusCodeAndData(200, checkObject);
              } else {
                callbackStatusCodeAndData(403);
              }
            }
          );
        } else {
          callbackStatusCodeAndData(403, {
            message: "Invalid tokenid in the headers",
          });
        }
      } else {
        callbackStatusCodeAndData(404);
      }
    });
  } else {
    callbackStatusCodeAndData(400, { message: "Invalid checkId" });
  }
};
/**
 *put handler for checks
 * @param {object} dataReceived object that goes into this handler
 * @param {function} callbackStatusCodeAndData function that injects statuscode and data to be sent back (object)
 */
handlers._checks.put = function (dataReceived, callbackStatusCodeAndData) {
  callbackStatusCodeAndData(400);
};
/**
 *delete handler for checks
 * @param {object} dataReceived object that goes into this handler
 * @param {function} callbackStatusCodeAndData function that injects statuscode and data to be sent back (object)
 */
handlers._checks.delete = function (dataReceived, callbackStatusCodeAndData) {
  callbackStatusCodeAndData(400);
};

module.exports = handlers;
