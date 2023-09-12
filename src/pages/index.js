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
    // const options = {
    //   method: 'GET',
    //   headers: {
    //     'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
    //     'X-RapidAPI-Host': 'tiktok-download-video-no-watermark.p.rapidapi.com'
    //   }
    // };

    try {
      //   const response = await fetch(link, options);
      //   const tiktokResult = await response.text();
      const tiktokResult = {
        link: "https://www.tiktok.com/@bayareafoodies/video/7272892446126771498?is_from_webapp=1&sender_device=pc&web_id=7276748523473864235",
        data: {
          id: "7272892446126771498",
          type: "tiktok",
          desc: "#japanesecurry #katsu #burlingamecalifornia #cupertino #bayareafoodies #japanesefood ",
          create_time: 1693352246,
          video_duration: 25378,
          cover_uri:
            "tos-useast5-p-0068-tx/osw5BbrfnDvk8kcEpuDgoqET7BSI8ltgeUR1DA",
          cover_origin_uri:
            "tos-useast5-p-0068-tx/09c50b5caae546d3b317e9c78a74501a_1693352247",
          cover_dynamic_uri:
            "tos-useast5-p-0068-tx/f796b1ca881a43a5a5789b1c8c2da403_1693352247",
          author_unique_id: "bayareafoodies",
          author_nickname: "Tim",
          author_uid: "6735990259215614981",
          author_avatar_uri:
            "tos-maliva-avt-0068/bfe6a74cc2d5e2e907fcdcecd2f660b7",
          video_id: "v12044gd0000cjn81qbc77uff7rirbig",
          video_link_nwm_hd: "",
          statistics: {
            aweme_id: "7272892446126771498",
            collect_count: 469,
            comment_count: 4,
            digg_count: 1361,
            download_count: 0,
            forward_count: 0,
            lose_comment_count: 0,
            lose_count: 0,
            play_count: 24108,
            share_count: 579,
            whatsapp_share_count: 4,
          },
          music: {
            id: 6756177818679265000,
            title: "Chill Day",
            cover:
              "https://p77-sg.tiktokcdn.com/aweme/100x100/tos-alisg-v-2774/2f144730c4794d7e8968969017d35f64.jpeg",
            cover_uri: "tos-alisg-v-2774/2f144730c4794d7e8968969017d35f64",
            author: "LAKEY INSPIRED",
            author_avatar_uri: "",
            uri: "https://sf16-ies-music-sg.tiktokcdn.com/obj/tos-alisg-ve-2774/0885d3a1cfa94c93a3d0c7e79e0a88a4",
          },
          cover:
            "https://p16-tiktokcdn-com.akamaized.net/aweme/100x100/tos-maliva-avt-0068/bfe6a74cc2d5e2e907fcdcecd2f660b7.png",
          cover_origin:
            "https://p16-tiktokcdn-com.akamaized.net/aweme/1080x1080/tos-maliva-avt-0068/bfe6a74cc2d5e2e907fcdcecd2f660b7.png",
          cover_dynamic: "",
          author_avatar:
            "https://p16-tiktokcdn-com.akamaized.net/aweme/100x100/tos-maliva-avt-0068/bfe6a74cc2d5e2e907fcdcecd2f660b7.png",
          video_link_wm:
            "https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/play/?video_id=v12044gd0000cjn81qbc77uff7rirbig&line=0&watermark=1&logo_name=tiktok_m&source=AWEME_DETAIL&file_id=6c8fc478e47b4afdaa65fa7b778559fb&item_id=7272892446126771498&signv3=dmlkZW9faWQ7ZmlsZV9pZDtpdGVtX2lkLmEyYzIxMTY5ZTMzMmE3ZDU2MjMxM2EzODZlMDUxZDg0",
          video_link_nwm:
            "https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/play/?video_id=v12044gd0000cjn81qbc77uff7rirbig&line=0&is_play_url=1&source=PackSourceEnum_AWEME_DETAIL&file_id=8f46bd51034b445dac52492b943bdcdc&item_id=7272892446126771498&signv3=dmlkZW9faWQ7ZmlsZV9pZDtpdGVtX2lkLjczODU4MzIyMTAxYTlmZTNjN2VjNWU5MDY4Yjc4MzJh",
        },
      };
      const whisperResult = await makePostRequest("/api/whisper", tiktokResult);
      setTiktokData(tiktokResult);
      // console.log(whisperResult.output)
      setTextFromSpeech(whisperResult.output);
      // console.log(textFromSpeech)

      const text =
        "This is one of the best Japanese curry spots in the bay. Curry Hula ranked 55 in Yelp's top 100 restaurants in the US. We're talking a curry with over 30 ingredients. Talk about a complexity of flavors. And if you don't mind a spicy butthole, add some habanero powder for extra flavor. And oh man, that was some bomb curry, certified bussin', umami overload. Sweat drippin' from my nose level of good. And if you want a secret menu tip, ask for the katsu curry with omurice. It's a game changer. #japanesecurry #katsu #burlingamecalifornia #cupertino #bayareafoodies #japanesefood";

      const locationResult = await makePostRequest("/api/openai_location", {
        data: text,
      });
      setLocations(locationResult.output.choices[0].message.content);
      // to do next -> connect to serp api and find the coordinates and video ocr
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
