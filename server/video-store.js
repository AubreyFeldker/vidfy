var proxy = require('express-http-proxy');
const express = require("express");
var bodyParser = require('body-parser')

const axios = require("axios");
const app = express();
app.use( bodyParser.json() ); 
app.use(express.static(__dirname + '/video_files'));

const multer  = require('multer')

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './video_files/')
    },
    filename: function (req, file, cb) {
        let extArray = file.mimetype.split("/");
        let extension = extArray[extArray.length - 1];
        console.log(req);
        cb(null, Date.now() + '.mp4');
    }
});

var upload = multer({
    storage: storage,
    limits: { fieldSize: 100 * 1024 * 1024 }
});

app.post("/file-upload", upload.any('video'), async function (req, res) {
    console.log(req.body);

    console.log("uploaded the video.")
    const proxy_res = await axios.post("http://localhost:5000/file-confirm",
        {
            this_id: req.body.id,
            file_id: req.files[0].filename.split(".")[0],
            file_loc: "http://localhost:6001",
        }
    );
    if (proxy_res.ok)
        res.status(200).send({message: "Video uploaded!"});
    else {
        //delete file from the server
        res.status(400).send("something went wrong!");
    }
});
  
var upload = multer({
    storage: storage,
    limits: { fieldSize: 100 * 1024 * 1024 }
});

axios.post("http://localhost:5000/link-server",
    {
        type: "storage",
        address: "http://localhost:6001"
    }
).then((res) => console.log(res))
.catch((err) => console.log(err));

const server = app.listen(6001, function () {
    const port = server.address().port;
    console.log(
      "Listening at http://localhost:" +
        port +
        " exporting the directory " +
        __dirname
    );
});