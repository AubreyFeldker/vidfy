var proxy = require('express-http-proxy');
const express = require("express");
const app = express();

app.get("/", function (request, response) {
    console.log("request achieved");
    response.send("Simple web server of files from " + __dirname);
  });

const server = app.listen(5000, function () {
    const port = server.address().port;
    console.log(
      "Listening at http://localhost:" +
        port +
        " exporting the directory " +
        __dirname
    );
  });