var proxy = require('express-http-proxy');
const express = require("express");
var bodyParser = require('body-parser')

const axios = require("axios");
const app = express();
app.use(bodyParser.json())
app.use(express.static(__dirname + '/video_files'));

let metadata_server_addr = null;
const storage_addrs = [];
const await_tags = new Map();

app.get("/", function (req, res) {
    console.log("request achieved");
    res.send("Simple web server of files from " + __dirname);
});

app.post("/file-upload", async function (req, res) {
    if(storage_addrs.length == 0) {
        console.log("Server infrastructure not fully connected.");
        return res.status(400).json({id:-1, err:"Server infrastructure not fully connected."});
    }
    try {
        const this_id = Date.now();
        await_tags.set(this_id, req.body.tags);
        res.status(200).send({vid_id: this_id, vid_server: storage_addrs[0]});
    }
    catch (error) {
        res.status(400).send();
        console.log(error);
    }
});

app.post("/file-confirm", async function (req, res) {
    console.log(await_tags);
    const await_tags_key = parseInt(req.body.this_id);
    const file_tags = await_tags.get(await_tags_key) ?? [];
    if (file_tags.length === 0)
        res.status(400).send("Tags were not properly uploaded.");
    
    const metadata_res = await axios.post(metadata_server_addr, {
        file_id: req.body.file_id,
        file_loc: req.body.file_loc,
        tags: file_tags,
    });
    
    await_tags.delete(await_tags_key);
    console.log(metadata_res);
    res.status(200).send({message: "Video uploaded!"});
});

app.get("/search", async function (req, res) {
    if(!metadata_server_addr) {
        console.log("No metadata server.");
        return res.status(404).json({id:-1, err:"No metadata server."});
    }

    console.log(`${metadata_server_addr}/search-tags`);
    const metadata_res = await axios.get(`${metadata_server_addr}/search-tags`, {params: {tags: req.query.tags}});
    console.log(metadata_res);
    if (metadata_res)
        return res.status(200).json(metadata_res.data);
    else
        return res.status(400).send("nothing...");
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