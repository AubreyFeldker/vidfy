var proxy = require('express-http-proxy');
const express = require("express");

var bodyParser = require('body-parser')
const axios = require("axios");
const app = express();
app.use( bodyParser.json() ); 

let metadata_server_addr = null;
const storage_addrs = [];

app.get("/", function (req, res) {
    console.log("request achieved");
    res.send("Simple web server of files from " + __dirname);
});

const multer  = require('multer')
const upload = multer({ dest: './video_files/',
    limits: { fieldSize: 100 * 1024 * 1024 }
})

app.post("/file-upload", upload.any('video'), async function (req, res) {
    console.log(req.body);
    
    if(!metadata_server_addr) {
        console.log("No metadata server.");
        return res.status(404).json({id:-1, err:"No metadata server."});
    }

    const metadata_res = await axios.post(metadata_server_addr, {tags: req.body.tags});
    console.log(metadata_res);
});

app.post("/link-server", function (req, res) {
    var server_type = req.body.type;
    var server_address = req.body.address;

    console.log(req.body);

    if((server_type !== "metadata" && server_type !== "storage") || server_address === null)
        return res.status(404).send({message: "Invalid server link."});
    if (server_type === "metadata")
        metadata_server_addr = server_address;
    else
        storage_addrs.push(server_address);
    return res.status(200).send({message: "You're connected to the server."});
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