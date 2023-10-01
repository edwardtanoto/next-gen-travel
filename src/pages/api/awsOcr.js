const AWS = require("aws-sdk");
const OpenAI = require("openai");
// Configure AWS SDK
AWS.config.update({
  region: "us-east-1",
});
const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition();

const axios = require("axios");
const stream = require("stream");
export default async function handler(req, res) {
  //if (!req.body.data?.id) return;
  let videoUrl;
  let videoKey;
  const isTiktok = req.body.hasOwnProperty("data");
  const isInstagram = req.body.hasOwnProperty("items");
  const bucketName = "next-travel-app";

  if (isTiktok) {
    videoKey = `video/${req.body.data.id}.mp4`;
    videoUrl = req.body.data.video_link_wm;
  } else if (isInstagram) {
    videoKey = `video/${req.body.items[0].code}.mp4`;
    videoUrl = req.body.items[0].video_versions[0].url;
    console.log("video Key: ", videoKey);
    console.log("video URL: ", videoUrl);
  } else return;

  console.log("Starting video upload ");
  console.time("upload vid to s3");

  await uploadVideoToS3(videoUrl, bucketName, videoKey);
  console.log("upload vid to s3");
  console.timeEnd("upload vid to s3");

  // Start video text detection
  console.log("Starting video text detection");
  console.time("start vid text detection");

  const jobId = await startVideoTextDetection(bucketName, videoKey);
  console.log("start vid text detection");
  console.timeEnd("start vid text detection");

  console.log("Complete video text detection");

  // Check video text detection status and retrieve detected texts
  console.time("check vid text detection");

  const detectedTexts = await checkVideoTextDetectionStatus(jobId);
  console.log("check vid text detection");
  console.timeEnd("check vid text detection");

  console.log(detectedTexts);

  console.time("open ai ocr clean up location");

  const response = await openAIDetectLocation(detectedTexts);

  res.status(200).json(response.choices[0].message.content);
}

const uploadVideoToS3 = async (videoUrl, bucketName, keyName) => {
  try {
    const response = await axios({
      url: videoUrl,
      method: "GET",
      responseType: "stream",
    });

    const pass = new stream.PassThrough();
    const params = {
      Bucket: bucketName,
      Key: keyName,
      Body: pass,
      ContentType: response.headers["content-type"],
      ContentLength: response.headers["content-length"],
    };

    // Pipe the Axios response stream to the PassThrough stream
    response.data.pipe(pass);

    const upload = s3.upload(params).promise();
    await upload;

    console.log("Video uploaded successfully");
  } catch (error) {
    console.error("Error:", error);
  }
};

const startVideoTextDetection = async (bucketName, videoKey) => {
  const params = {
    Video: {
      S3Object: {
        Bucket: bucketName,
        Name: videoKey,
      },
    },
  };

  const response = await rekognition.startTextDetection(params).promise();
  return response.JobId;
};

const checkVideoTextDetectionStatus = async (jobId) => {
  let response;
  console.log("in check video text detection");
  do {
    response = await rekognition.getTextDetection({ JobId: jobId }).promise();
    console.log(response);

    if (response.JobStatus === "SUCCEEDED") {
      console.log("SUCCEEDED");
      var keywords = new Set();
      response.TextDetections.forEach((item) => {
        //   console.log(typeof item);
        if (String(item).includes("TikTok") || String(item).includes("@bucket"))
          return;

        keywords.add(item.TextDetection.DetectedText);
      });
      return keywords;
    } else if (["FAILED", "STOPPED"].includes(response.JobStatus)) {
      throw new Error(
        `Text detection failed with status: ${response.JobStatus}`
      );
    }
    await sleep(5000); // wait for 5 seconds before polling again
  } while (response.JobStatus === "IN_PROGRESS");
};

const openAIDetectLocation = async (detectedTexts) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "Your job is to clean data to get locations from objects.",
      },
      {
        role: "user",
        content:
          "Given set of strings, get all the specific locations\n\nSet: {\n  'TikTok',\n  '@bucketlistbums',\n  '10 Most Instagrammable',\n  'Places in Istanbul',\n  '10',\n  'Most',\n  'Instagrammable',\n  'Places',\n  'in',\n  'Istanbul',\n  'ل TikTok',\n  'ل',\n  'Suleymaniye Mosque',\n  'Suleymaniye',\n  'Mosque',\n  'Galata Tower',\n  'VITAVIEN',\n  'KARVE',\n  'Galata',\n  'Tower',\n  'E',\n  'LIMAN',\n  'Ajwa Hotel Steps',\n  'Ajwa',\n  'Hotel',\n  'Steps',\n  '30',\n  'Blue Mosque',\n  'Blue',\n  'Balat',\n  'Neighborhood',\n  'Balat Neighborhood',\n  'Seven Hills Rooftop Terrace',\n  'S',\n  'Seven',\n  'Hills',\n  'Rooftop',\n  'Terrace',\n  'DE',\n  'Basilica Cistern',\n  'Basilica',\n  'Cistern',\n  'Topkapi Palace',\n  'Topkapi',\n  'Palace',\n  'Taht Rooftop',\n  'Taht',\n  'Grand Bazaar',\n  'Grand',\n  'Bazaar',\n  'Fed',\n  'FedEx',\n  'Follow me on Instagram',\n  'AJWA',\n  'Follow',\n  'me',\n  'on',\n  'Instagram',\n  'AIWA'\n}",
      },
      {
        role: "assistant",
        content:
          "'Suleymaniye Mosque', 'Galata Tower', 'Ajwa Hotel Steps',  'Blue Mosque',  'Balat Neighborhood',  'Seven Hills Rooftop Terrace',  'Basilica Cistern',  'Topkapi Palace',  'Taht Rooftop',  'Grand Bazaar'",
      },
      {
        role: "user",
        content: `Given set of strings, get all the specific locations ${JSON.stringify(
          [...detectedTexts]
        )}`,
      },
    ],
    temperature: 1,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  console.log(response);
  console.log(response.choices[0]);
  console.log(typeof response.choices[0].message.content);
  console.log(response.choices[0].message.content);
  console.log("open ai ocr clean up location");
  console.timeEnd("open ai ocr clean up location");
  return response;
};

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
