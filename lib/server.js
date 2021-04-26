//@ts-check
//main file

//dependencies
const http = require("http");
const https = require("https");
const { StringDecoder } = require("string_decoder");
const config = require("./config");
const fs = require("fs");
const handlers = require("./handlers");
const helpers = require("./helpers");
const path = require("path");

const server = {};

//create the http server
server.httpServer = http.createServer((request, response) => {
  server.unifiedServer(request, response);
});

//https server needs more configuration
//this case we need to read it synchronously
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, "../https/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "../https/certificate.pem")),
};

//create the https server
server.httpsServer = https.createServer(
  server.httpsServerOptions,
  (request, response) => {
    server.unifiedServer(request, response);
  }
);

//master server logic
server.unifiedServer = function (request, response) {
  //the base URL is as follows
  const baseURL = "http://" + request.headers.host + "/";

  //new URL requires base url
  const rawUrl = new URL(request.url, baseURL);

  //get the pathname
  const pathname = rawUrl.pathname;

  //trim the slashes
  const trimmedPath = pathname.replace(/^\/+|\/+$/g, "");

  //get the querystring
  const searchParams = rawUrl.searchParams;

  //getting method and lowercasing just in case
  const method = request.method.toLowerCase();

  //getting headers
  const headers = request.headers;

  //getting payload
  //most json or other strings are utf-8
  const decoder = new StringDecoder("utf-8");
  //since payload is a stream
  let buffer = "";

  //write in the buffer when you receive data
  request.on("data", (data) => {
    buffer += decoder.write(data);
  });

  //when stream ends
  request.on("end", () => {
    buffer += decoder.end();

    const chosenHandler =
      typeof server.router[trimmedPath] !== "undefined"
        ? server.router[trimmedPath]
        : handlers.notFound;

    /**
     * @typedef {Object} Query
     * @property {Function} get - Takes in key(string) and gets the value
     * @property {Function} set - Takes in key(string) and sets the value
     */

    /**
     * @type {{headers:Object,trimmedPath:string,searchParams:Query,method:string,payload:Object}}
     */
    const dataToBeSentToTheHandler = {
      headers,
      trimmedPath,
      searchParams,
      method,
      payload: helpers.parseJson(buffer),
    };
    //call the chosen handler
    chosenHandler(
      dataToBeSentToTheHandler,
      (statusCodeToWrite, dataToBeSentBackInTheResponse) => {
        //remember that this callback is only going to be called when the handler finishes its task
        //the handler also passes the statuscode and the payload to be sent back
        const statusCode =
          typeof statusCodeToWrite === "number" ? statusCodeToWrite : 200;
        //status code might not be defined by some handlers
        //the payload might be empty as some handlers might not send back anything like the notFound handler
        const payload =
          typeof dataToBeSentBackInTheResponse === "object"
            ? dataToBeSentBackInTheResponse
            : {};

        const payloadJSON = JSON.stringify(payload);

        //notify that the response is a json
        response.setHeader("Content-Type", "application/json");
        response.writeHead(statusCode);
        response.end(payloadJSON);

        //logging stuffs
        console.log("Served was pinged on", pathname);
        console.log("Server responded with", statusCode, payloadJSON);
      }
    );
  });
};

//router
server.router = {
  sample: handlers.sample,
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks,
};

//init script
server.init = function () {
  //listen for http server
  server.httpServer.listen(config.httpPort, () => {
    console.log(
      `HTTP:Listening on port ${config.httpPort} . Environment is set to ${config.envName}`
    );
  });
  //listen for https server
  server.httpsServer.listen(config.httpsPort, () => {
    console.log(
      `HTTPS:Listening on port ${config.httpsPort} . Environment is set to ${config.envName}`
    );
  });
};

module.exports = server;
