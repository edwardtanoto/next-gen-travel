import Replicate from "replicate";

export default async function handler(req, res) {
  if (req.method === "POST") {
    console.log(req.body);
    let videoURL;
    if (req.body.hasOwnProperty("data")) {
      videoURL = req.body.data.video_link_wm;
    } else {
      videoURL = req.body.items[0].video_versions[0].url;
    }
    console.log(videoURL);
    // body.data.video
    const replicate = new Replicate({
      auth: process.env.REPLICATE_AUTH_KEY,
    });

    const output = await replicate.run(
      "openai/whisper:91ee9c0c3df30478510ff8c8a3a545add1ad0259ad3a9f78fba57fbc05ee64f7",
      {
        input: {
          audio: `${videoURL}.mp4`,
        },
      }
    );
    console.log(output.transcription);
    res.status(200).json({ output: output.transcription });
  } else {
  }
}
