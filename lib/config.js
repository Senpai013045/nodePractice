//create and export configuration variables

//container for environments
const environments = {};

//for staging
environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: "staging",
  hashingSecret: "Senpai013045",
  maxChecks: 5,
  loopTime: 60000,
  twilio: {
    accountSid: "ACfa45a5311987f746fc84f6f6880e0545",
    authToken: "e08f7c431792a7284ee34856b0fc15d2",
    fromPhone: "+17866134174",
  },
};

//for production
environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: "production",
  hashingSecret: "IndecentBanana69",
  maxChecks: 5,
  loopTime: 60000,
  twilio: {
    accountSid: "ACfa45a5311987f746fc84f6f6880e0545",
    authToken: "e08f7c431792a7284ee34856b0fc15d2",
    fromPhone: "+17866134174",
  },
};

//getting current environment if mentioned or switching it for empty string as default
const currentEnvironment =
  typeof process.env.NODE_ENV === "string"
    ? process.env.NODE_ENV.toLowerCase()
    : "";

// check is the current environment exists in our container or default to staging

const environmentToExport =
  typeof environments[currentEnvironment] === "object"
    ? environments[currentEnvironment]
    : environments.staging;

//export the environment

module.exports = environmentToExport;
