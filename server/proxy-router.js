var proxy = require('express-http-proxy');
const express = require("express");
const app = express();

const fs = require('fs');

const multer  = require('multer')
const upload = multer({ dest: './video_files/',
    limits: { fieldSize: 100 * 1024 * 1024 }
 })

app.get("/", function (request, response) {
    console.log("request achieved");
    response.send("Simple web server of files from " + __dirname);
  });

  app.post("/file-upload", upload.any('video'), function (req, res) {
    //fs.createWriteStream('./videofiles/file.png', request.data);
    console.log(req.files);
    res.send({message: "i got the file"});
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