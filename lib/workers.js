//woker related stuffs

//dependencies
const config = require("./config");
const _data = require("./data");

//container
const workers = {};

//gathering all checks
workers.gatherAllChecks = () => {
  //get all checks
  _data.list("checks", (err, checkIds) => {
    if (!err && checkIds && checkIds.length > 0) {
      checkIds.forEach((checkId) => {
        //read each of them
        _data.read("checks", checkId, (error, checkData) => {
          if (!error && checkData) {
            workers.validateCheckData(checkData);
          } else {
            console.log(
              "[workers.gatherAllChecks] Error: reading one of check data"
            );
          }
        });
        //pass it to the validator
      });
    } else {
      console.log("[wokers.getherAllChecks] Error: No checks to process");
    }
  });
};

//sanity checking in the checkData
workers.validateCheckData = function (originalCheckData) {
  originalCheckData =
    typeof originalCheckData == "object" && originalCheckData !== null
      ? originalCheckData
      : {};
  originalCheckData.checkId =
    typeof originalCheckData.checkId == "string" &&
    originalCheckData.checkId.trim().length == 20
      ? originalCheckData.checkId.trim()
      : false;
  originalCheckData.phoneNumber =
    typeof originalCheckData.phoneNumber == "string" &&
    originalCheckData.phoneNumber.trim().length == 10
      ? originalCheckData.phoneNumber.trim()
      : false;
  originalCheckData.protocol =
    typeof originalCheckData.protocol == "string" &&
    ["http", "https"].indexOf(originalCheckData.protocol) > -1
      ? originalCheckData.protocol
      : false;
  originalCheckData.url =
    typeof originalCheckData.url == "string" &&
    originalCheckData.url.trim().length > 0
      ? originalCheckData.url.trim()
      : false;
  originalCheckData.method =
    typeof originalCheckData.method == "string" &&
    ["post", "get", "put", "delete"].indexOf(originalCheckData.method) > -1
      ? originalCheckData.method
      : false;
  originalCheckData.successCodes =
    typeof originalCheckData.successCodes == "object" &&
    originalCheckData.successCodes instanceof Array &&
    originalCheckData.successCodes.length > 0
      ? originalCheckData.successCodes
      : false;
  originalCheckData.timeoutSeconds =
    typeof originalCheckData.timeoutSeconds == "number" &&
    originalCheckData.timeoutSeconds % 1 === 0 &&
    originalCheckData.timeoutSeconds >= 1 &&
    originalCheckData.timeoutSeconds <= 5
      ? originalCheckData.timeoutSeconds
      : false;
  // Set the keys that may not be set (if the workers have never seen this check before)
  originalCheckData.state =
    typeof originalCheckData.state == "string" &&
    ["up", "down"].indexOf(originalCheckData.state) > -1
      ? originalCheckData.state
      : "down";
  originalCheckData.lastChecked =
    typeof originalCheckData.lastChecked == "number" &&
    originalCheckData.lastChecked > 0
      ? originalCheckData.lastChecked
      : false;

  // If all checks pass, pass the data along to the next step in the process
  if (
    originalCheckData.checkId &&
    originalCheckData.phoneNumber &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.successCodes &&
    originalCheckData.timeoutSeconds
  ) {
    workers.performCheck(originalCheckData);
  } else {
    // If checks fail, log the error and fail silently
    console.log(
      "[workers.validateCheckData] Error: one of the checks is not properly formatted. Skipping."
    );
  }
};

//performing checks
workers.performCheck = (originalCheckData) => {
  //prepare initial outcome
  let checkOutcome = {
    error: false,
    responseCode: false,
  };

  //state to check if the outcome has been sent
  let outcomeSent = false;

  //parse host name and path of the original checkData
  const rawUrl = `${checkData.protocol}://${originalCheckData.url}/`;
  const parsedUrl = new URL(rawUrl);
  const { hostname, pathname } = parsedUrl;
  //continue from here
};

//timer to loop
workers.loop = () => {
  setInterval(() => {
    workers.gatherAllChecks();
  }, config.loopTime);
};

//init script
workers.init = () => {
  //execute gatherAllChecksImmediately
  workers.gatherAllChecks();
  //call the loop to keep executing
  workers.loop();
};

//export
module.exports = workers;
