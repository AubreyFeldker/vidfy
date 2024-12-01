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
});

const app = express();
app.use( bodyParser.json() ); 

app.post("/tag-list", async function (req, res) {
    if(req.body.tag)
        return res.status(200).json(await Tag.find({word: req.body.tag}));
    else
        return res.status(200).json(await Tag.find({}));
});

app.post("/", async function (req, res) {
    const file_id = req.body.file_id;
    const file_loc = req.body.file_loc;
    const newTags = req.body.tags;
    
    const file = new File({
        _id: file_id,
        tags: newTags,
        locations: [file_loc],
    });
    await file.save();

    for (const newTag of newTags) {
        const result = await Tag.findOneAndUpdate({word: newTag}, { $set: {word: newTag}, $push: {foundIn: file._id}}, {upsert: true, new: true}).exec();
        console.log(result);
    }

    res.status(200).json({file_id: file._id});
});

app.get("/search-tags", async function (req, res) {
    const newTags = req.query.tags.split(" ");
    const tag_files = (await Tag.find({word: newTags[0]}))[0].foundIn;
    console.log(tag_files);
    const files = [];
    await Promise.all(tag_files.map(async (file) => {
        const foundFile = await File.findOne({_id: file});
        files.push(foundFile);
    }));
    console.log(await File.find({}));
    return res.status(200).json(files);
});

app.post("/purge", async function (req, res) {
    await File.deleteMany({});
    await Tag.deleteMany({});
    return res.status(200).json("Purged database");
});

axios.post("http://localhost:5000/link-server",
    {
        type: "metadata",
        address: "http://localhost:6000"
    }
).then((res) => console.log(res))
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