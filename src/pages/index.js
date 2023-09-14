import { useEffect, useState } from "react";
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
      const tiktokResult = {
        link: "https://www.tiktok.com/@theguynextdoor3/video/7211918122868051205?is_from_webapp=1&sender_device=pc",
        data: {
          id: "7211918122868051205",
          type: "tiktok",
          desc: "Top 10 Places to Visit in Taiwan | #travel #taiwan #trending ",
          create_time: 1679155542,
          video_duration: 158267,
          cover_uri: "tos-maliva-p-0068/o0dEMFDw98heABJA8kQYReQm9DIUbBZnQrwqpA",
          cover_origin_uri:
            "tos-maliva-p-0068/12497037369344e0ac56cbb582c35ba3_1679155565",
          cover_dynamic_uri:
            "tos-maliva-p-0068/2fcdfd2c186240b98f0dad743067f64e_1679155566",
          author_unique_id: "theguynextdoor3",
          author_nickname: "TheGuyNextDoor",
          author_uid: "6922666745606685698",
          author_avatar_uri:
            "tos-useast2a-avt-0068-giso/b0963a9e4c0b961fa53e0719440640cf",
          video_id: "v09044g40000cgatum3c77u47kpsgmfg",
          video_link_nwm_hd: "",
          statistics: {
            aweme_id: "7211918122868051205",
            collect_count: 12010,
            comment_count: 241,
            digg_count: 21554,
            download_count: 969,
            forward_count: 0,
            lose_comment_count: 0,
            lose_count: 0,
            play_count: 569965,
            share_count: 8294,
            whatsapp_share_count: 1402,
          },
          music: {
            id: 7211918228858441000,
            title: "original sound - TheGuyNextDoor",
            cover:
              "https://p16-sign-useast2a.tiktokcdn.com/tos-useast2a-avt-0068-giso/b0963a9e4c0b961fa53e0719440640cf~c5_100x100.webp?x-expires=1694743200&x-signature=pHC%2F1zTbI6Tp5LcLRKigcfwi3Kg%3D",
            cover_uri:
              "tos-useast2a-avt-0068-giso/b0963a9e4c0b961fa53e0719440640cf",
            author: "TheGuyNextDoor",
            author_avatar_uri:
              "tos-useast2a-avt-0068-giso/b0963a9e4c0b961fa53e0719440640cf",
            uri: "https://sf16-ies-music-va.tiktokcdn.com/obj/musically-maliva-obj/7211918224793881349.mp3",
          },
          cover:
            "https://p16-tiktokcdn-com.akamaized.net/aweme/100x100/tos-useast2a-avt-0068-giso/b0963a9e4c0b961fa53e0719440640cf.png",
          cover_origin:
            "https://p16-tiktokcdn-com.akamaized.net/aweme/1080x1080/tos-useast2a-avt-0068-giso/b0963a9e4c0b961fa53e0719440640cf.png",
          cover_dynamic: "",
          author_avatar:
            "https://p16-tiktokcdn-com.akamaized.net/aweme/100x100/tos-useast2a-avt-0068-giso/b0963a9e4c0b961fa53e0719440640cf.png",
          video_link_wm:
            "https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/play/?video_id=v09044g40000cgatum3c77u47kpsgmfg&line=0&watermark=1&logo_name=tiktok&source=AWEME_DETAIL&file_id=52c1fef4206b477d9e22b00f21ea403e&item_id=7211918122868051205&signv3=dmlkZW9faWQ7ZmlsZV9pZDtpdGVtX2lkLjgwZDU0NjgxZWI4ZmIxYzYxMGQ0NzdmNWYxZDhlZjYw",
          video_link_nwm:
            "https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/play/?video_id=v09044g40000cgatum3c77u47kpsgmfg&line=0&is_play_url=1&source=PackSourceEnum_AWEME_DETAIL&file_id=dbe8e427442044df94a8b7488c213898&item_id=7211918122868051205&signv3=dmlkZW9faWQ7ZmlsZV9pZDtpdGVtX2lkLmVhNzEzZDkzZjI4ZjU1MzJjYzI5OTVkMjk0M2I2ZTlk",
        },
      };
      // const response = await fetch(link, options);
      // let tiktokResult = await response.text();
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

  useEffect(() => {
    if (locations === undefined || locations.length != 0) {
      console.log(locations);
      // to do next -> connect to serp api and find the coordinates and video ocr
      push({ pathname: "/map", query: { location: locations } });
    }
  }, [locations]);

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
