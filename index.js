//main file

//dependencies
const http = require("http");
const https = require("https");
const { StringDecoder } = require("string_decoder");
const config = require("./config");
const fs = require("fs");

//create the http server
const httpServer = http.createServer((request, response) => {
  unifiedServer(request, response);
});

//listen for http server
httpServer.listen(config.httpPort, () => {
  console.log(
    `Listening on port ${config.httpPort} . Environment is set to ${config.envName}`
  );
});

//https server needs more configuration
//this case we need to read it synchronously
const httpsServerOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/certificate.pem"),
};

//create the https server
const httpsServer = https.createServer(
  httpsServerOptions,
  (request, response) => {
    unifiedServer(request, response);
  }
);

//listen for https server
httpsServer.listen(config.httpsPort, () => {
  console.log(
    `Listening on port ${config.httpsPort} . Environment is set to ${config.envName}`
  );
});

//master server logic
function unifiedServer(request, response) {
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
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    const dataToBeSentToTheHandler = {
      trimmedPath,
      searchParams,
      method,
      buffer,
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
        console.log("Served was pinged on", pathname, "with data", buffer);
        console.log("Server responded with", statusCode, payloadJSON);
      }
    );
  });
}

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

//router
var router = {
  sample: handlers.sample,
  ping: handlers.ping,
};
