const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const fileSchema = new Schema({
    tags: [String],
});

const tagSchema = new Schema({
    word: String,
    foundIn: [{type: Schema.Types.ObjectId, ref: 'File'}],

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
    const newTags = req.body.tags.split(",");
    
    const file = new File({
        tags: newTags
    });
    await file.save();

    for (const newTag of newTags) {
        const result = await Tag.findOneAndUpdate({word: newTag}, { $set: {word: newTag}, $push: {foundIn: file._id}}, {upsert: true, new: true}).exec();
        console.log(result);
    }

    res.status(200).json({file_id: file._id});
});

axios.post("http://localhost:5000/link-server",
    {
        type: "metadata",
        address: "http://localhost:6000"
    }
).then((res) => console.log(res));

const server = app.listen(6000, function () {
    const port = server.address().port;
    console.log(
      "Listening at http://localhost:" +
        port +
        " exporting the directory " +
        __dirname
    );
});