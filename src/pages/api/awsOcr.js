const AWS = require("aws-sdk");
const OpenAI = require("openai");

export default async function handler(req, res) {
  // Configure AWS SDK
  AWS.config.update({
    region: "us-east-1",
  });

  const s3 = new AWS.S3();
  const rekognition = new AWS.Rekognition();

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
          if (
            String(item).includes("TikTok") ||
            String(item).includes("@bucket")
          )
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

  const sleep = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

  (async () => {
    const bucketName = "next-travel-app";
    const videoKey = "video.mp4";

    // Start video text detection
    console.log("Starting video text detection");
    const jobId = await startVideoTextDetection(bucketName, videoKey);
    console.log("Complete video text detection");

    // Check video text detection status and retrieve detected texts
    const detectedTexts = await checkVideoTextDetectionStatus(jobId);
    console.log(detectedTexts);

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
            "Cleaned Set: {\n  'Suleymaniye Mosque',\n  'Galata Tower',\n  'Ajwa Hotel Steps',\n  'Blue Mosque',\n  'Balat Neighborhood',\n  'Seven Hills Rooftop Terrace',\n  'Basilica Cistern',\n  'Topkapi Palace',\n  'Taht Rooftop',\n  'Grand Bazaar'\n}",
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
    console.log(response.choices[0].message.content);
    return response;
  })();
}
