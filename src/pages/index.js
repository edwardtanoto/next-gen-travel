import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { makePostRequest } from "../lib/api";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function Home() {
  const { push } = useRouter();

  const [locations, setLocations] = useState([]);
  const [textFromSpeech, setTextFromSpeech] = useState("");
  const [count, setCount] = useState(0);
  const [tiktokData, setTiktokData] = useState({ title: "", data: "" });
  const map = useRef(null);
  const mapContainer = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/justinlee38/clmpqt0v504qv01p70r70flq2",
      projection: "globe",
      center: [0, 0],
      zoom: 1.2,
    });

    map.current.on("style.load", () => {
      map.current.setFog(null);
    });

    // The following values can be changed to control rotation speed:

    // At low zooms, complete a revolution every two minutes.
    const secondsPerRevolution = 30;
    // Above zoom level 5, do not rotate.
    const maxSpinZoom = 5;
    // Rotate at intermediate speeds between zoom levels 3 and 5.
    const slowSpinZoom = 3;

    let userInteracting = false;
    let spinEnabled = true;

    function spinGlobe() {
      const zoom = map.current.getZoom();
      if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > slowSpinZoom) {
          // Slow spinning at higher zooms
          const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
          distancePerSecond *= zoomDif;
        }
        const center = map.current.getCenter();
        center.lng -= distancePerSecond;
        // Smoothly animate the map over one second.
        // When this animation is complete, it calls a 'moveend' event.
        map.current.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }
    spinGlobe();

    map.current.on("mousedown", () => {
      userInteracting = true;
    });

    // Restart spinning the globe when interaction is complete
    map.current.on("mouseup", () => {
      userInteracting = false;
      spinGlobe();
    });

    // These events account for cases where the mouse has moved
    // off the map, so 'mouseup' will not be fired.
    map.current.on("dragend", () => {
      userInteracting = false;
      spinGlobe();
    });
    map.current.on("pitchend", () => {
      userInteracting = false;
      spinGlobe();
    });
    map.current.on("rotateend", () => {
      userInteracting = false;
      spinGlobe();
    });

    map.current.on("moveend", () => {
      spinGlobe();
    });
  });

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

  const regex = /(tiktok|Instagram)/i;
  function handleClipboard() {
    navigator.clipboard
      .readText()
      .then(async (clipboardItem) => {
        if (regex.test(clipboardItem)) {
          document.querySelector(".input-box").value = clipboardItem;
        }
      })
      .catch((error) => {
        console.error(error);
      });
    window.removeEventListener("focus", handleClipboard);
  }

  useEffect(() => {
    if (!navigator.clipboard) {
      setError({
        message:
          "Clipboard API not available. Please accept the permission request.",
      });
      return;
    }

    function handlePasteEvent(event) {
      handleClipboard();
      event.preventDefault();
    }

    document.addEventListener("paste", handlePasteEvent);
    window.addEventListener("load", handlePasteEvent);
    return () => {
      document.removeEventListener("paste", handlePasteEvent);
      window.addEventListener("load", handlePasteEvent);
    };
  }, []);

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
      let tiktokResult = {
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
      setLoading(true);
      // const response = await fetch(link, options);
      // let tiktokResult = await response.text();
      //tiktokResult = JSON.parse(tiktokResult);
      console.log("tr ", tiktokResult);
      //const whisperResult = await makePostRequest("/api/whisper", tiktokResult);
      const whisperResult =
        "Here are the top 10 places to visit in Taiwan. Taipei 101, the iconic skyscraper in Taipei, is one of the tallest buildings in the world and offers stunning views of the city. The building also has the fastest elevator in the world, which can transport visitors from the 5th floor to the 89th floor in just 37 seconds. Taroko Gorge Located in the Taroko National Park, Taroko Gorge is a breathtaking natural wonder with towering cliffs, waterfalls, and marble formations. The largest lake in Taiwan, Sun Moon Lake, is a popular tourist destination for its scenic beauty, cycling routes, and hiking trails. It is a must-visit destination for anyone traveling to Taiwan, offering a unique and unforgettable experience for visitors of all ages. Jiufen A charming town located in the mountains near Taipei, Jufen is famous for its narrow alleys, tea houses, and stunning ocean views. Kenting National Park Located at the southern tip of Taiwan, Kenting National Park is a popular beach destination with a wide variety of outdoor activities. Tainan The oldest city in Taiwan, Tainan is famous for its historical sites, temples, and traditional food. Yashin National Park Home to Taiwan's highest peak, Yashin National Park is a hiker's paradise with stunning mountain views and natural hot springs. Baitou Hot Springs Located just outside Taipei, Baitou is a popular hot spring destination known for its natural hot springs, spas, and beautiful scenery. Alishan A mountainous region in central Taiwan, Alishan is famous for its scenic railway, tea plantations, and stunning sunrises. Visitors can enjoy the natural beauty of the forest by taking a train ride through the mountains or by hiking along the many trails that wind through the forest. The Fo Guangshan Buddha Museum is a large Buddhist cultural complex located in the Daxiu district of Kyushu. The museum contains a vast collection of Buddhist art and artifacts, as well as numerous exhibits on Buddhist history, philosophy, and practice. Where do you want to visit next?";
      setTiktokData(tiktokResult);
      // console.log(whisperResult.output)
      setTextFromSpeech(whisperResult.output);
      // console.log(textFromSpeech)
      console.log("whr ", whisperResult);
      const text = whisperResult + tiktokResult.data.desc;
      console.log("txt ", text);
      const locationResult = await makePostRequest("/api/openai_location", {
        data: text,
      });

      setLocations(locationResult.output.choices[0].message.content);
      console.log("loc ", locations);
      setLoading(false);
      // // to do next -> connect to serp api and find the coordinates and video ocr
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (locations === undefined || locations.length != 0) {
      // to do next -> connect to serp api and find the coordinates and video ocr
      push({ pathname: "/map", query: { location: locations } });
    }
  }, [locations]);

  const continents = ["asia", "europe", "africa", "america"];
  const handleInput = (e) => {
    setLink(e.target.value);
  };
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCount((prevIndex) => (prevIndex + 1) % continents.length);
    }, 2500);

    return () => clearInterval(intervalId); // Cleanup the interval on unmount
  }, [continents]);

  return (
    <div className="text-center">
      <div ref={mapContainer} className="map-container"></div>
      <div className="title">/world.</div>
      {loading ? (
        ""
      ) : (
        <div className="form-group">
          <p>drop tiktok travel link</p>
          <form onSubmit={handleSubmit(onSubmit)}>
            <input
              {...register("link", { required: true })}
              className="input-box"
            />
            <div>
              <p id="outbox"></p>
            </div>
            {/* <br />
        <br /> */}
            <input type="submit" className="submit-box" id="outbox" />
          </form>
        </div>
      )}
      {/* <p className="py-4">{textFromSpeech}</p>
      <p className="py-4">
        caption: {tiktokData.data === null ? "null" : tiktokData.data.desc}
      </p>
      <p>locations:</p>
      <p>{locations}</p> */}
    </div>
  );
}
