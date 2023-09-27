const AWS = require("aws-sdk");
const path = require("path");
const sleep = require("util").promisify(setTimeout);

// Configure AWS SDK
AWS.config.update({
  region: "us-east-1",
});

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const s3 = new AWS.S3({});

      s3.listBuckets(function (err, data) {
        if (err) {
          console.log("Error", err);
        } else {
          console.log("Success", data.Buckets);
        }
      });

      const transcoder = new AWS.ElasticTranscoder();
      const rekognition = new AWS.Rekognition();

      const uploadVideoToS3 = async (videoPath, bucketName) => {
        var videoData;
        try {
          videoData = require("fs").readFileSync(path.resolve(videoPath));
        } catch (error) {
          console.error("Error encountered:", error);
        }
        const command = {
          Bucket: bucketName,
          Key: "video.mp4",
          Body: videoData,
        };

        try {
          const response = await s3.upload(command);
          console.log(response);
          return response.Location;
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
        try {
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
        } catch (error) {
          console.error("Error initiating transcoding job:", error);
          throw error;
        }
      };

      const waitForTranscoderJobToFinish = async (pipelineId, jobId) => {
        while (true) {
          try {
            const params = {
              Id: jobId,
            };

            const result = await transcoder.readJob(params).promise();

            if (["Complete", "Canceled", "Error"].includes(result.Job.Status)) {
              return result.Job.Status;
            }

            await sleep(5000); // wait for 5 seconds before polling again
          } catch (error) {
            console.error("Error checking transcoding job status:", error);
            throw error;
          }
        }
      };

      const detectTextInImage = async (bucketName, keyframeKey) => {
        try {
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
        } catch (error) {
          if (error.code === "ThrottlingException") {
            console.warn("Rate limit hit. Retrying after delay...");
            await sleep(1000); // waiting for 1 second before retrying
            return await detectTextInImage(bucketName, keyframeKey);
          } else {
            console.error("Error detecting text in image:", error);
            throw error;
          }
        }
      };

      const listThumbnailKeys = async (bucketName, prefix) => {
        try {
          const params = {
            Bucket: bucketName,
            Prefix: prefix,
          };

          const response = await s3.listObjectsV2(params).promise();
          return response.Contents.map((item) => item.Key);
        } catch (error) {
          console.error("Error listing objects in S3:", error);
          throw error;
        }
      };

      (async () => {
        try {
          const videoPath = "./dummyData/tiktok.mp4";
          const bucketName = "next-travel-app";
          const pipelineId = "1695717658905-rzwbo3";

          // Upload video
          console.log("Uploading video");
          const videoLocation = await uploadVideoToS3(videoPath, bucketName);
          console.log("Done uploading video");

          // Extract keyframes
          console.log("Extracting keyframes");
          const job = await extractKeyframes(
            "video.mp4",
            "outputKeyframePrefix",
            bucketName,
            pipelineId
          );
          console.log("Done extracting keyframes");
          console.log(job);

          const jobStatus = await waitForTranscoderJobToFinish(
            pipelineId,
            job.Id
          );
          if (jobStatus !== "Complete") {
            throw new Error(`Transcoder job ended with status: ${jobStatus}`);
          }

          // Get list of generated thumbnails
          const thumbnailPrefix = "thumbnails/"; // adjust based on how you've set your output settings in the transcoder
          const listOfExtractedKeyframeKeys = await listThumbnailKeys(
            bucketName,
            thumbnailPrefix
          );

          // Here, you might want to list objects from S3 to get all the generated thumbnails
          // Then, send each thumbnail to Rekognition for text detection.
          const textResults = [];
          for (let keyframeKey of listOfExtractedKeyframeKeys) {
            const detectedTexts = await detectTextInImage(
              bucketName,
              keyframeKey
            );
            textResults.push(...detectedTexts);
          }

          console.log(textResults);
        } catch (error) {
          console.error("Error in main flow:", error);
        }
      })();

      res.status(200).json({ result });
    } catch (err) {
      res.status(500).json({ error: "failed to load data" });
    }
  } else {
  }
}
