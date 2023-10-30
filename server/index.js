require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Multer = require("multer");
const AWS = require("aws-sdk");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const port = 6060;
let sqsQueueUrl;
AWS.config.update({ region: "ap-southeast-2" });

// AWS S3 Configuration
const s3 = new AWS.S3();

// AWS SQS Configuration
const sqs = new AWS.SQS();

const storage = new Multer.memoryStorage();
const upload = Multer({
  storage,
});

const app = express();
app.use(cors());

app.post("/upload", upload.single("my_file"), async (req, res) => {
  try {
    const fileBuffer = req.file.buffer;
    const format = req.body.format;
    // Generate a unique filename using uuid
    const filename = uuidv4();

    // Upload to S3
    await s3
      .putObject({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `uploads/${filename}`,
        Body: fileBuffer,
        ContentType: req.file.mimetype,
      })
      .promise();

    // Enqueue transformation job to SQS
    const sqsParams = {
      MessageBody: JSON.stringify({
        filename: filename,
        format: format,
      }),
      QueueUrl: sqsQueueUrl,
    };
    await sqs.sendMessage(sqsParams).promise();

    res.json({ photoId: filename });
  } catch (error) {
    console.log(error);
    res.send({
      message: error.message,
    });
  }
});

app.get("/status/:id", async (req, res) => {
  // You can use S3's object existence check or other logic to verify if processing is done
  // For this example, we're checking if the processed image exists on S3
  try {
    await s3
      .headObject({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `processed/${req.params.id}`,
      })
      .promise();
    res.json({ status: "done" });
  } catch (error) {
    res.json({ status: "pending" });
  }
});

const determineDimensions = (format) => {
  switch (format) {
    case "1:1 Square":
      return { width: 1080, height: 1080 };
    case "4:5 Portrait":
      return { width: 864, height: 1080 };
    case "16:9 Landscape":
      return { width: 1920, height: 1080 };
    default:
      return { width: 1080, height: 1920 }; // Defaults to '9:16 Instagram Story'
  }
};

const processSQSMessages = async () => {
  try {
    const messages = await sqs
      .receiveMessage({
        QueueUrl: sqsQueueUrl,
        MaxNumberOfMessages: 10, // Change as needed
        WaitTimeSeconds: 20, // Long polling
      })
      .promise();

    if (messages.Messages) {
      for (const message of messages.Messages) {
        const body = JSON.parse(message.Body);
        const filename = body.filename;
        const format = body.format;
        const dimensions = determineDimensions(format);
        // Download the image from S3
        const s3Data = await s3
          .getObject({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `uploads/${filename}`,
          })
          .promise();

        // Process the image using Sharp (e.g., resize)
        const processedImage = await sharp(s3Data.Body)
          .resize(dimensions.width, dimensions.height)
          .toBuffer();

        // Upload the processed image back to S3, for this example, in a 'processed' directory
        await s3
          .putObject({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `processed/${filename}`,
            Body: processedImage,
          })
          .promise();

        // Delete the message from the queue
        await sqs
          .deleteMessage({
            QueueUrl: sqsQueueUrl,
            ReceiptHandle: message.ReceiptHandle,
          })
          .promise();
      }
    }
  } catch (error) {
    console.error("Error processing SQS message:", error);
  }
};

const ensureBucketExists = async (bucketName) => {
  try {
    await s3.createBucket({ Bucket: bucketName }).promise();
    console.log(`Created bucket: ${bucketName}`);
  } catch (err) {
    // We will ignore 409 errors which indicate that the bucket already exists
    if (err.statusCode !== 409) {
      console.log(`Error creating bucket: ${err}`);
    } else {
      console.log(`Bucket ${bucketName} already exists.`);
    }
  }
};

const ensureQueueExists = async (queueName) => {
  try {
    const result = await sqs.getQueueUrl({ QueueName: queueName }).promise();
    console.log(`Queue ${queueName} exists at URL ${result.QueueUrl}`);
    sqsQueueUrl = result.QueueUrl;
  } catch (error) {
    if (error.code === "AWS.SimpleQueueService.NonExistentQueue") {
      const result = await sqs.createQueue({ QueueName: queueName }).promise();
      console.log(`Queue ${queueName} created at URL ${result.QueueUrl}`);
      sqsQueueUrl = result.QueueUrl;
    } else {
      throw error;
    }
  }
};

// Initialize resources and start the server
const initAndStartServer = async () => {
  try {
    // Ensure resources exist
    await ensureBucketExists(process.env.S3_BUCKET_NAME);
    await ensureQueueExists(process.env.SQS_QUEUE_NAME);

    // Start the server
    app.listen(port, () => {
      console.log(`Server Listening on ${port}`);
    });

    // Set an interval to poll SQS and process messages
    setInterval(processSQSMessages, 30000); // Poll every 30 seconds, adjust as needed
  } catch (error) {
    console.error("Error initializing resources:", error);
  }
};

initAndStartServer();
