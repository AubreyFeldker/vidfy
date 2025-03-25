const express = require("express");
const bodyParser = require('body-parser');
const findPorts = require('find-free-ports');
const fs = require('fs');
const { exec } = require('node:child_process');

const axios = require("axios");
const app = express();
app.use( bodyParser.json() ); 
app.use(express.static(__dirname + '/video_files'));

const multer  = require('multer');

//Automatically upload sent video files to the temps folder
//With a generic ID
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './video_files/temps/')
    },
    filename: function (req, file, cb) {
        let extArray = file.mimetype.split("/");
        let extension = extArray[extArray.length - 1];
        cb(null, `${Date.now()}`);
    }
});

var upload = multer({
    storage: storage,
    limits: { fieldSize: 100 * 1024 * 1024 }
});

let host_addr = "";
const server_id = fs.readFileSync('./id.txt').toString();

app.get("/", async function(req, res) {
    res.status(200).send(`Alive at ${host_addr}`);
});

//On file upload
app.post("/file-upload", upload.any('video'), async function (req, res) {
    console.log(req.body);
    const file_id = req.files[0].filename;

    //Takes the temporary file and executes a ffmpeg command to decompress it, then creases 2 different pipelines
    //to create a very compressed, smaller thumbnail file, and a less compressed viewing file
    exec(`ffmpeg -i ./video_files/temps/${file_id} -filter_complex "[0:v]split=2[s0][s1];[s0]scale=-2:360[v0];[s1]scale=-2:720[v1]" \
        -map "0:a?" -map "[v0]" -c:v libx264 -preset fast -crf 35 -profile:v main -g 250 -pix_fmt yuv420p -acodec aac -ar 44100 -b:a 160k video_files/thumbs/${file_id}.mov \
        -map "0:a?" -map "[v1]" -c:v libx264 -preset fast -crf 28 -profile:v main -g 250 -pix_fmt yuv420p -acodec aac -ar 44100 -b:a 160k video_files/fulls/${file_id}.mov`
        , async function(error, stdout, stderr) {
        if (error) {
            return console.error(`Error with transcoding: ${error}`);
        }

        console.log(stdout);

        //Deletes the temporary file, no longer needs it
        fs.unlink(`./video_files/temps/${file_id}`, async function(err) {
            //Send request to the main proxy that the file information
            //can be uploaded to the mongodb database now
            const proxy_res = await axios.post("http://localhost:5000/file-confirm",
                {
                    this_id: req.body.id,
                    file_id: file_id,
                    file_loc: server_id,
                }
            );
            if (proxy_res.ok)
                res.status(200).send({message: "Video uploaded!"});
            else {
                //delete file from the server
                res.status(400).send("something went wrong!");
            }
        });
    });
});
    
//Find a random unused port to start the server on
findPorts().then((ports) => {
    const port_num = ports[0];
    host_addr = `http://localhost:${port_num}`;

    axios.post("http://localhost:5000/link-server",
        {
            type: "storage",
            address: host_addr,
            id: server_id,
        }
    ).then((res) => console.log(res))
    .catch((err) => console.log(err));
    
    const server = app.listen(port_num, function () {
        const port = server.address().port;
        console.log(
          "Listening at http://localhost:" +
            port +
            " exporting the directory " +
            __dirname
        );
    });
});
