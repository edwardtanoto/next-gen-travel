const AWS = require("aws-sdk");
const path = require("path");

// Configure AWS SDK
AWS.config.update({
  region: "us-west-1",
});

const s3 = new AWS.S3();
const transcoder = new AWS.ElasticTranscoder();
const rekognition = new AWS.Rekognition();

const uploadVideoToS3 = async (videoPath, bucketName) => {
  var videoData;
  try {
    videoData = require("fs").readFileSync(path.resolve(videoPath));
  } catch (error) {
    console.error("Error encountered:", error);
  }
  const params = {
    Bucket: bucketName,
    Key: "video.mp4", // Change as required
    Body: videoData,
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error("Error encountered:", error);
  }
};

const extractKeyframes = async (
  inputKey,
  outputKey,
  bucketName,
  pipelineId
) => {
  const params = {
    PipelineId: pipelineId,
    Input: { Key: inputKey },
    Outputs: [
      {
        Key: outputKey,
        ThumbnailPattern: "thumbnails/{count}", // This will generate images for keyframes
        PresetId: "1351620000001-000020", // JPEG output preset
      },
    ],
  };

  const result = await transcoder.createJob(params).promise();
  return result.Job;
};

const detectTextInImage = async (bucketName, keyframeKey) => {
  const params = {
    Image: {
      S3Object: {
        Bucket: bucketName,
        Name: keyframeKey,
      },
    },
  };

  const result = await rekognition.detectText(params).promise();
  return result.TextDetections.map((det) => det.DetectedText);
};

(async () => {
  const videoPath = "./dummyData/tiktok.mp4";
  const bucketName = "your-s3-bucket-name";
  const pipelineId = "your-elastic-transcoder-pipeline-id";

  // Upload video
  const videoLocation = await uploadVideoToS3(videoPath, bucketName);

  // Extract keyframes
  const job = await extractKeyframes(
    "video.mp4",
    "outputKeyframePrefix",
    bucketName,
    pipelineId
  );

  // Assuming you wait for the job to finish (which would require polling Elastic Transcoder),
  // then you'd fetch the generated thumbnails and send each to Rekognition for text detection.
  const textResults = [];

  for (let keyframeKey of listOfExtractedKeyframeKeys) {
    // This list would come from your S3 bucket's output directory
    const detectedTexts = await detectTextInImage(bucketName, keyframeKey);
    textResults.push(...detectedTexts);
  }

  console.log(textResults);
})();
