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
const res = await cloudinary.uploader.upload(file,{effect: "gen_remove:prompt_fries"});
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
    const cldRes = await handleUpload(dataURI);
    res.json(cldRes);
  } catch (error) {
    console.log(error);
    res.send({
      message: error.message,
    });
  }
});

app.get("/generateImageWithEffect", (req, res) => {
  const imagePath = "nkkmns8y41juz0cftftz";
  const effect = "gen_remove:fries";
  
  // Generate the modified Cloudinary image URL with the specified effect
  const modifiedImageUrl = cloudinary.url(imagePath, { effect: effect });
  
  res.json({ imageUrl: modifiedImageUrl });
  
});

const port = 6060;
app.listen(port, () => {
  console.log(`Server Listening on ${port}`);
});

  