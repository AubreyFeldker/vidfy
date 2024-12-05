const fs = require("fs");
const fs_prom = require("fs/promises");
const path = require("path");
const axios = require("axios");

async function random_file(dir) {
    const files = await fs_prom.readdir(dir);
    const index = Math.floor(Math.random() * files.length); 
    return files[index];
}

function getRandomSubarray(arr, size) {
    var shuffled = arr.slice(0), i = arr.length, min = i - size, temp, index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}

const strings = [
    'water', 'park', 'man', 'dog', 'fish', 'beluga', 'drinking', 'divine', 'pierce', 'fire', 'noise', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
    'cat', 'wolf', 'pirate', 'conk', 'penguin', 'door', 'short', 'war', 'path', 'elephant', 'john', 'steinbeck', 'bathroom', 'kitchen', 'worst', 'best', 'air', 'earth',
    'cloud', 'strife', 'pencil', 'pen', 'nerd', 'joke','jock','short','long','middle','force','mass','acceleration','drift', 'shift'
]

async function upload(filePath, tags) {
    const prox_res = await axios.post(`http://localhost:5000/file-upload`, {tags: tags})
        const file = new File([fs.readFileSync(filePath)], filePath)
   
        const form = new FormData();
        form.append('video', file);
        form.append('id', prox_res.data.vid_id);

        const response = await fetch(`${prox_res.data.vid_server}/file-upload`, {
            method: 'POST',
            body: form
        });
        return 'uploaded';
}

let i = 0;

function uploadRandom() {
    random_file('X:/Downloads/Charades_v1').then(async function (file) {
        await upload('X:/Downloads/Charades_v1/' + file, getRandomSubarray(strings, 5));
        i++;
        if(i > 200) {stopFunction(); }
    });
}

const myVar = setInterval(function(){ uploadRandom() }, 2000);

function stopFunction() {
    clearInterval(myVar);
}