const express = require("express");
const bodyParser = require('body-parser');
const findPorts = require('find-free-ports');
const fs = require('fs');
const { spawn } = require('node:child_process');

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

const vidProgresses = new Map();

//Check video processing progress
app.get("/progress/:vid_id", async function(req, res) {
    const vidName = req.params.vid_id;
    const vidProgress = vidProgresses.get(vidName);

    if(!vidProgress || vidProgress === -1)
        res.status(400).send({progress: -1});
    else
        res.status(200).send({progress: vidProgress});
});

//On file upload
app.post("/file-upload", upload.any('video'), async function (req, res) {
    const file_id = req.files[0].filename;
    let frameCount = -1;

    vidProgresses.set(file_id, 0);
    res.status(200).send(file_id);

    // Quickly fetch the frame count of the video for a progress bar
    const checkProgress = spawn('ffprobe',
        `-v error -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 ./video_files/temps/${file_id}`
        .split(" "));
    checkProgress.stdout.on('data', async function(data) {
        frameCount = parseInt(data);
        console.log(frameCount);
    });

    checkProgress.on('close', async function() {

    //Takes the temporary file and executes a ffmpeg command to decompress it, then creases 2 different pipelines
    //to create a very compressed, smaller thumbnail file, and a less compressed viewing file
    const ffmpegArgs = [
        '-i', `./video_files/temps/${file_id}`,
        '-progress', '-',
        '-v', 'quiet',
        '-filter_complex', '[0:v]split=2[s0][s1];[s0]crop=in_h:in_h,scale=250:250[v0];[s1]scale=-2:720[v1]',
        '-map', '0:a?', '-map', '[v1]',
        '-c:v', 'libx264', '-preset', 'fast',
        '-crf', '28', '-profile:v', 'main',
        '-g', '250', '-pix_fmt', 'yuv420p',
        '-acodec', 'aac', '-ar', '44100',
        '-b:a', '160k',
        `video_files/fulls/${file_id}.mov`,
        '-map', '0:a?', '-map', '[v0]',
        '-c:v', 'libx264', '-preset', 'fast',
        '-crf', '28', '-profile:v', 'main',
        '-g', '250', '-pix_fmt', 'yuv420p',
        '-acodec', 'aac', '-ar', '44100',
        '-b:a', '160k', '-t', '00:00:10.0',
        `video_files/thumbs/${file_id}.mov`
    ];

    
    const vidProcess = spawn(`ffmpeg`, ffmpegArgs);
        vidProcess.stdout.on('data', async function(data) {
            const currentFrame = parseInt(String(data).split('\n')[0].split('=')[1]);
            const progress = currentFrame * 1.0 / frameCount;
            console.log(`${file_id} progress: ${progress}`);
            vidProgresses.set(file_id, progress);
        });

        vidProcess.stderr.setEncoding("utf8")
        vidProcess.stderr.on('data', err => {console.log(err);} );

        vidProcess.on('exit', async function() {
            //Delete cached file process 1 minute after rendering finished, no longer relevant
            setTimeout(() => {vidProgresses.delete(file_id)}, 60000);

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
                console.log(proxy_res.status === 200);
            });
    });
    });
});

app.get("/")
    
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
