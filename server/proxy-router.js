var proxy = require('express-http-proxy');
const express = require("express");
var bodyParser = require('body-parser')

const axios = require("axios");
const app = express();
app.use(bodyParser.json())

let metadata_server_addr = null;
const storage_addrs = new Map();
const store_addrs_array = [];
const await_tags = new Map();

app.get("/", function (req, res) {
    console.log("request achieved");
    res.send("Simple web server of files from " + __dirname);
});

app.post("/file-upload", async function (req, res) {
    //Check if there's both metadata and video servers attached
    if(storage_addrs.size == 0 || !metadata_server_addr) {
        console.log("Server infrastructure not fully connected.");
        return res.status(400).json({id:-1, err:"Server infrastructure not fully connected."});
    }
    try {
        //Video ID and tags saved within a map while waiting for file upload
        // Such that database isn't uploaded if there is an error with the file upload
        const this_id = Date.now();
        await_tags.set(this_id, req.body.tags);
        //Get a random server to upload video to
        const upload_addr = storage_addrs.get(store_addrs_array[Math.floor(Math.random() * store_addrs_array.length)]).addr;
        //Sends request back to client that it can upload the video now
        res.status(200).send({vid_id: this_id, vid_server: upload_addr});
    }
    catch (error) {
        res.status(400).send();
        console.log(error);
    }
});

//This is gotten from the video-store once the file is uploaded
app.post("/file-confirm", async function (req, res) {
    //Get the stored tags based on the global video ID
    const await_tags_key = parseInt(req.body.this_id);
    const file_tags = await_tags.get(await_tags_key) ?? [];
    if (file_tags.length === 0)
        return res.status(400).send("Tags were not properly uploaded.");
    
    //Send a request to the metadata server to store the video information
    const metadata_res = await axios.post(metadata_server_addr, {
        file_id: req.body.file_id,
        file_loc: req.body.file_loc,
        tags: file_tags,
    });

    //No longer need to keep the video information locally
    await_tags.delete(await_tags_key);
    console.log(metadata_res);
    //Video uploading done!
    res.status(200).send({message: "Video uploaded!"});
});

//Search for tags
app.get("/search", async function (req, res) {
    //Check if metadata server is connected
    if(!metadata_server_addr) {
        console.log("No metadata server.");
        return res.status(404).json({id:-1, err:"No metadata server."});
    }

    console.log(`${metadata_server_addr}/search-tags`);
    //Search metadata store for videos based off the tags provided
    const metadata_res = await axios.get(`${metadata_server_addr}/search-tags`, {params: {tags: req.query.tags}});
    const search_params = metadata_res.data;
    console.log(search_params);
    if (search_params) {
        // Maps the server ids of each video's location to server addresses
        // because the server address may change
        const valid_addrs = search_params.filter((file) => storage_addrs.has(file.locations[0]));
        const changed_addrs = valid_addrs.map((file) => {
            return {_id: file._id,
                tags: file.tags,
                location: storage_addrs.get(file.locations[0]).addr
            }
        });
        return res.status(200).json(changed_addrs);
    }
    else
        return res.status(400).send("nothing...");
});

//Metadata/video servers access here to join
app.post("/link-server", function (req, res) {
    const server_type = req.body.type;
    const server_address = req.body.address;

    console.log(req.body);

    if((server_type !== "metadata" && server_type !== "storage") || server_address === null)
        return res.status(404).send({message: "Invalid server link."});
    //Write metadata server address
    if (server_type === "metadata")
        metadata_server_addr = server_address;
    //Add video server address to both a map and array
    //for fast lookup and random access
    else {
        const server_id = req.body.id;
        storage_addrs.set(server_id, {addr: server_address, alive: true});
        store_addrs_array.push(server_id);
    }
    return res.status(200).send({message: "You're connected to the server."});
});

// SERVER CREATION

//Sets up the server at localhost port 5000
const server = app.listen(5000, function () {
    const port = server.address().port;
    console.log(
      "Listening at http://localhost:" +
        port +
        " exporting the directory " +
        __dirname
    );
});