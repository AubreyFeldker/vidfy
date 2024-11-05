const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const files = new Enmap({name: "files", dataDir: "./metadata"});
const tags = new Enmap({name: "tags", dataDir: "./metadata"});

function FileStruct(id, tags) {
    this.id = id;
    this.tags = tags;
}

function TagStruct(tag) {
    this.tag = tag;
    this.foundIn = [];
}

const app = express();
app.use( bodyParser.json() ); 

app.post("/", function (req, res) {
    const tags = req.body.tags;
    const id = files.autonum;

    files.update(id, new FileStruct(id,tags));

    for (const tag in tags) {
        tags.ensure(tag, new TagStruct(tag));
        tags.push(tag, id, "foundIn");
    }

    res.status(200).json({id:id});
});

const server = app.listen(6000, function () {
    const port = server.address().port;
    console.log(
      "Listening at http://localhost:" +
        port +
        " exporting the directory " +
        __dirname
    );
});