const { app, BrowserWindow, ipcMain, dialog } = require('electron/main');
const path = require('node:path');
const proxy_server = "http://localhost:5000";

const axios = require("axios");

const fs  = require("fs");

let tags = [];

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

// Uses electron to open a video file of the user's choosing
// Adds it to a form, then starts server communication
async function handleFileOpen(args) {
    console.log(args.filters);
    //Uses electron's interface with system file explorer
    const { canceled, filePaths } = await dialog.showOpenDialog({filters: args.filters});
    if (!canceled && args.tags != "") {
        // Gives the server the tags and makes sure it is all set up before uploading video
        const prox_res = await axios.post(`http://localhost:5000/file-upload`, {tags: args.tags});
        const file = new File([fs.readFileSync(filePaths[0])], filePaths[0]);
   
        // Must create a form to upload the file
        const form = new FormData();
        form.append('video', file);
        console.log(prox_res);
        //Response from proxy has both the global video ID of the video to be uploaded,
        //and the address for the server being uploaded to
        form.append('id', prox_res.data.vid_id);
        const response = await fetch(`${prox_res.data.vid_server}/file-upload`, {
            method: 'POST',
            body: form
        });
        return("Video uploaded!");
    }
};

// Search for a set of user-defined tags from the MongoDB database
async function search(args) {
    const response = await axios.get("http://localhost:5000/search", {params: {tags: args.tags}});
    console.log(response.data);
    return(response.data);
}

async function getRequest(req) {
    console.log(req);
    axios.get(req).then(response => {
        console.log(response.data);
        return response;
    });
}

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 600,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    ipcMain.handle('dialog:openFile', (event, ...args) => handleFileOpen(...args));
    ipcMain.handle('uploadFile', (event, ...args) => handleFileOpen(...args));
    ipcMain.handle('search', (event, ...args) => search(...args));
    ipcMain.handle('makeRequest', (event, ...args) => getRequest(...args));
    createWindow();

    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
