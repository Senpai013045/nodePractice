//main file

const server = require("./lib/server");
const workers = require("./lib/workers");

const app = {};

app.init = function () {
  //start the server
  server.init();
  //start workers
  workers.init();
};

//self executing
app.init();
