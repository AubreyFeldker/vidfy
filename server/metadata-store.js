const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const fileSchema = new Schema({
    _id: Number,
    tags: [String],
    locations: [String],
});

const tagSchema = new Schema({
    word: String,
    foundIn: [{type: Number, ref: 'File'}],

});

const File = mongoose.model("File", fileSchema);
const Tag = mongoose.model("Tag", tagSchema);

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1/project6", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(console.log("connected"));

const app = express();
app.use( bodyParser.json() ); 

app.post("/tag-list", async function (req, res) {
    if(req.body.tag)
        return res.status(200).json(await Tag.find({word: req.body.tag}));
    else
        return res.status(200).json(await Tag.find({}));
});

//Upload video information to the database
app.post("/", async function (req, res) {
    const file_id = req.body.file_id;
    const file_loc = req.body.file_loc;
    const newTags = req.body.tags;
    
    //Create file object from the request body and save it
    const file = new File({
        _id: file_id,
        tags: newTags,
        locations: [file_loc],
    });
    await file.save();

    //For each tag as a part of the video, find the corresponding tag document
    // and add the new video it appears on; creating a new doc if necessary
    for (const newTag of newTags) {
        const result = await Tag.findOneAndUpdate({word: newTag}, { $set: {word: newTag}, $push: {foundIn: file._id}}, {upsert: true, new: true}).exec();
        console.log(result);
    }

    res.status(200).json({file_id: file._id});
});

app.get("/search-tags", async function (req, res) {
    const newTags = req.query.tags.split(" ");
    let tag_files = [];
    //For each tag in the query
    await Promise.all(newTags.map(async (userTag) => {
        //Find the tag's document
        const tag = await Tag.findOne({word: userTag});
        if (!tag)
            return;
        // For each file the tag is found in, add it to the tag_file array
        // which tracks the number of tags each file has attached to it
        tag.foundIn.forEach((file) => {
            const existFileIndex = tag_files.findIndex((el) => el.id === file);
            if (existFileIndex === -1) {
                file.tagMatch = 1;
                tag_files.push({id: file, tagMatch: 1});
            }
            else {
                tag_files[existFileIndex].tagMatch++;
            }
        });
    }));
    
    if (tag_files.length === 0)
        return res.status(400).json({msg: "No videos with those tags found."});
    // Sort videos by the number of matching tags they have to the query, descending
    tag_files.sort((a,b) => b.tagMatch - a.tagMatch);
    const files = [];
    //Get the file documents from the database for each video chosen
    await Promise.all(tag_files.map(async (file) => {
        const foundFile = await File.findOne({_id: file.id});
        files.push(foundFile);
    }));
    // Return files to proxy
    return res.status(200).json(files);
});

//Removes all tags from the database
app.post("/purge", async function (req, res) {
    await File.deleteMany({});
    await Tag.deleteMany({});
    return res.status(200).json("Purged database");
});

// SERVER CREATION

axios.post("http://localhost:5000/link-server",
    {
        type: "metadata",
        address: "http://localhost:6000"
    }
).then((res) => console.log(res.data))
.catch((err) => console.log(err));

const server = app.listen(6000, function () {
    const port = server.address().port;
    console.log(
      "Listening at http://localhost:" +
        port +
        " exporting the directory " +
        __dirname
    );
});