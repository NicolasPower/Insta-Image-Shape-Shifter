require("dotenv").config();
const express = require("express");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const Multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});
async function handleUpload(file) {
  const res = await cloudinary.uploader.upload(file, {
    resource_type: "auto",
  });
  return res;
}

const storage = new Multer.memoryStorage();
const upload = Multer({
  storage,
});

const app = express();
app.use(cors());

app.post("/upload", upload.single("my_file"), async (req, res) => {
  try {
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    // handle upload - swap to uploading to s3 instead of cloudinary
    // upload to folder called /uploads in s3 bucket
    const cldRes = await handleUpload(dataURI);

    // enqueue transformation job to SQS

    res.json(cldRes); // return ID/name of photo - probably use hashid or uuid
  } catch (error) {
    console.log(error);
    res.send({
      message: error.message,
    });
  }
});

// get route for checking if job is done
// check if output of processing exists
// app.get("status")

app.get("/generateImageWithEffect", (req, res) => {
  const imagePath = req.query.imagePath; // Extract the image path from the URL parameter
  const effect = "gen_remove:" + req.query.word;

  // Generate the modified Cloudinary image URL with the specified effect
  const modifiedImageUrl = cloudinary.url(imagePath, { effect: effect });

  res.json({ imageUrl: modifiedImageUrl });
});

// sqs processing
//https://chat.openai.com/share/871ff1ef-bbd2-4775-a883-0b99d790a5ad

const port = 6060;
app.listen(port, () => {
  console.log(`Server Listening on ${port}`);
});
