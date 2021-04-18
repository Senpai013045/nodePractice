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
};

//for production
environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: "production",
  hashingSecret: "IndecentBanana69",
  maxChecks: 5,
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
