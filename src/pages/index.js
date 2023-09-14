import { useState } from "react";
import { useForm } from "react-hook-form";
import { makePostRequest } from "../lib/api";
import { useRouter } from "next/navigation";

export default function Home() {
  const { push } = useRouter();
  const [locations, setLocations] = useState([]);
  const [textFromSpeech, setTextFromSpeech] = useState("");
  const [tiktokData, setTiktokData] = useState({ title: "", data: "" });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    const link = `https://tiktok-download-video-no-watermark.p.rapidapi.com/tiktok/info?url=${encodeURIComponent(
      data.link
    )}`;
    fetchTiktok(link);
  };

  const fetchTiktok = async (link) => {
    console.log("fetchTiktok ", link);
    const options = {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": "tiktok-download-video-no-watermark.p.rapidapi.com",
      },
    };

    try {
      const response = await fetch(link, options);
      let tiktokResult = await response.text();
      tiktokResult = JSON.parse(tiktokResult);

      const whisperResult = await makePostRequest("/api/whisper", tiktokResult);
      setTiktokData(tiktokResult);
      // console.log(whisperResult.output)
      setTextFromSpeech(whisperResult.output);
      // console.log(textFromSpeech)

      const text = whisperResult.output + tiktokResult.data.desc;
      const locationResult = await makePostRequest("/api/openai_location", {
        data: text,
      });

      setLocations(locationResult.output.choices[0].message.content);
      // // to do next -> connect to serp api and find the coordinates and video ocr
      push({ pathname: "/map", query: { location: locations } });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="text-center mt-10">
      <h1>find nice places</h1>
      <p>drop tiktok travel link</p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input {...register("link", { required: true })} />
        <input type="submit" />
      </form>
      <p className="py-4">{textFromSpeech}</p>
      <p className="py-4">
        caption: {tiktokData.data === null ? "null" : tiktokData.data.desc}
      </p>
      <p>locations:</p>
      <p>{locations}</p>
    </div>
  );
}
