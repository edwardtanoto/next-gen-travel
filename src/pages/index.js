import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { makePostRequest } from "../lib/api";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import "mapbox-gl/dist/mapbox-gl.css";
// import { db, insertQuery } from "./../lib/db";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const setupMapInteraction = (map, spinGlobe) => {};

export default function Home() {
  const { push } = useRouter();

  const [locations, setLocations] = useState([]);
  const [queryID, setQueryID] = useState();
  const [queryExist, setQueryExist] = useState();

  const [inputPlatform, setInputPlatform] = useState("");
  const [loading, setLoading] = useState(false);

  const map = useRef(null);
  const mapContainer = useRef(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/justinlee38/clmpqt0v504qv01p70r70flq2",
      projection: "globe",
      center: [0, 0],
      scrollZoom: false,
      doubleClickZoom: false,
      zoom: 2,
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

    map.current.on("mousedown", () => (userInteracting = true));

    const resetInteraction = () => {
      userInteracting = false;
      spinGlobe();
    };

    map.current.on("mouseup", resetInteraction);
    map.current.on("dragend", resetInteraction);
    map.current.on("pitchend", resetInteraction);
    map.current.on("rotateend", resetInteraction);
    map.current.on("moveend", spinGlobe);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onChange = (data) => {
    console.log("line103 ", data.trim());
  };
  const onSubmit = (data) => {
    const isTikTok = data.includes("tiktok");
    const isInstagram = data.includes("instagram");

    if (isTikTok || isInstagram) {
      setInputPlatform(isTikTok ? "tik.png" : "ig.png");

      const baseApiUrl = isTikTok
        ? "https://tiktok-download-video-no-watermark.p.rapidapi.com/tiktok/info"
        : "https://instagram-media-downloader.p.rapidapi.com/rapid/post_v2.php";

      const link = `${baseApiUrl}?url=${encodeURIComponent(data)}`;

      fetchFromSocial(link, isTikTok ? "tiktok" : "instagram");
    }
    // error handling
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

  const fetchFromSocial = async (link, platform) => {
    console.log("in fetech");
    console.log("fetchTiktok ", link);
    let options;
    if (platform === "tiktok") {
      options = {
        method: "GET",
        headers: {
          "X-RapidAPI-Key":
            "456b9d753bmsh684626de7cfebc7p1d7469jsn2f4e9d178868",
          "X-RapidAPI-Host":
            "tiktok-download-video-no-watermark.p.rapidapi.com",
        },
      };
    } else if (platform === "instagram") {
      options = {
        method: "GET",
        headers: {
          "X-RapidAPI-Key":
            "456b9d753bmsh684626de7cfebc7p1d7469jsn2f4e9d178868",
          "X-RapidAPI-Host": "instagram-media-downloader.p.rapidapi.com",
        },
      };
    }

    try {
      setLoading(true);
      setInputPlatform("rolling.gif");
      let whisperResult;
      let text;
      let ocrResult;
      let result;
      let queryObj;
      let caption;
      let locationResult;
      if (platform === "tiktok") {
        const response = await fetch(link, options);
        result = await response.text();
        result = JSON.parse(result);
        console.log("tr ", result);
        queryObj = { link_id: result.data.id, url: result.data.video_link_wm };

        caption = result.data.desc;
      } else if (platform === "instagram") {
        const response = await fetch(link, options);
        result = await response.json();
        console.log("ig ", result);
        queryObj = {
          link_id: result.data.id,
          url: result.items[0].video_versions[0].url,
        };
        caption = result.items[0].code;
      }
      let queryResult;
      console.log("test2");

      // queryObj = {
      //   link_id: "test2",
      // };

      try {
        console.log(queryObj);
        queryResult = await makePostRequest("/api/queryVideoId", queryObj);
        console.log(queryResult);
        setQueryExist(queryResult.exist);
      } catch (error) {
        console.error("Error fetching user data", error);
        // Handle error accordingly
      }

      if (queryResult.exist == "new") {
        console.log(result);
        whisperResult = makePostRequest("/api/whisper", result);
        ocrResult = await makePostRequest("/api/awsOcr", result);
        text = whisperResult + caption + ocrResult;

        // const text =
        //   "Here are the top 10 places to visit in Taiwan. Taipei 101, the iconic skyscraper in Taipei, is one of the tallest buildings in the world and offers stunning views of the city. The building also has the fastest elevator in the world, which can transport visitors from the 5th floor to the 89th floor in just 37 seconds. Taroko Gorge Located in the Taroko National Park, Taroko Gorge is a breathtaking natural wonder with towering cliffs, waterfalls, and marble formations. The largest lake in Taiwan, Sun Moon Lake, is a popular tourist destination for its scenic beauty, cycling routes, and hiking trails. It is a must-visit destination for anyone traveling to Taiwan, offering a unique and unforgettable experience for visitors of all ages. Jiufen A charming town located in the mountains near Taipei, Jufen is famous for its narrow alleys, tea houses, and stunning ocean views. Kenting National Park Located at the southern tip of Taiwan, Kenting National Park is a popular beach destination with a wide variety of outdoor activities. Tainan The oldest city in Taiwan, Tainan is famous for its historical sites, temples, and traditional food. Yashin National Park Home to Taiwan's highest peak, Yashin National Park is a hiker's paradise with stunning mountain views and natural hot springs. Baitou Hot Springs Located just outside Taipei, Baitou is a popular hot spring destination known for its natural hot springs, spas, and beautiful scenery. Alishan A mountainous region in central Taiwan, Alishan is famous for its scenic railway, tea plantations, and stunning sunrises. Visitors can enjoy the natural beauty of the forest by taking a train ride through the mountains or by hiking along the many trails that wind through the forest. The Fo Guangshan Buddha Museum is a large Buddhist cultural complex located in the Daxiu district of Kyushu. The museum contains a vast collection of Buddhist art and artifacts, as well as numerous exhibits on Buddhist history, philosophy, and practice. Where do you want to visit next?";

        locationResult = await makePostRequest("/api/openai_location", {
          data: text,
        });
        console.log("open api location");
        console.timeEnd("open api location");
        console.log(queryResult.query_id);
        setQueryID(queryResult.query_id[0].id);
        setLocations(locationResult.output.choices[0].message.content);
      } else {
        //exist: get locations from db and set location
        setLocations(queryResult.query_id);
      }

      setLoading(false);
      // // to do next -> connect to serp api and find the coordinates and video ocr
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (locations === undefined || locations.length != 0) {
      // to do next -> connect to serp api and find the coordinates and video ocr
      push({
        pathname: "/map",
        query: {
          location: locations,
          queryId: queryID,
          exist: queryExist || null,
        },
      });
    }
  }, [locations]);

  return (
    <div>
      <div ref={mapContainer} className="map-container"></div>
      <div
        className="header"
        style={{
          fontFamily: "Space Grotesk",
          fontWeight: 900,
        }}
      >
        milky way/earth/.
      </div>
      <div>
        <h1 className="title">SHARE MAP WITH YOUR FRIENDS.</h1>
        <div
          className="link-group"
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "600",
            fontFamily: "Space Grotesk",
          }}
        >
          <p>
            <a
              href="https://travelba.notion.site/example-tiktok-reels-videos-af1f8e17f1744598810db4b6ae91f2e2?pvs=4"
              target="_blank"
              className="link-group-content"
            >
              example videos
            </a>
          </p>
          <p>
            <a
              href="https://airtable.com/appctyRzceyhU0pFf/shrOg7scx2zlq1YGz"
              target="_blank"
              className="link-group-content"
            >
              join waitlist
            </a>
          </p>
          <p>
            <a
              href="https://travelba.notion.site/e921498e2b884f3e979c3bedaab92be6?v=6bae4287bb4b4553b953423eb1f59b15&pvs=4"
              target="_blank"
              className="link-group-content"
            >
              our community
            </a>
          </p>
          <p>
            <a
              href="https://travelba.notion.site/changelogs-81b8b3fff2ab4c36a8cca609289d33ba?pvs=4"
              target="_blank"
              className="link-group-content"
            >
              changelogs
            </a>
          </p>
        </div>
        <div className="form-group">
          <form
            // onChange={handleSubmit(onChange)}
            onPaste={handleSubmit(onChange)}
          >
            <span className="input-bg">
              <span className="input-bg-image" style={{ alignSelf: "center" }}>
                <img
                  src={`/${inputPlatform !== "" ? inputPlatform : "tik.png"}`}
                  width={"24px"}
                  style={{ padding: "6px", alignSelf: "center" }}
                />
              </span>
              <input
                placeholder="paste tiktok/reels link"
                {...register("link", { required: true })}
                onPaste={function (e) {
                  onSubmit(e.clipboardData.getData("Text"));
                  console.log(e.clipboardData.getData("Text"));
                }}
                className="input-box"
              />
            </span>
          </form>
          <br />
          <br />
          <p className="description">
            our mission is to fund every continent with japanese toilet,
            starting from a small city in north america named san franciso. (put
            some writing here)
          </p>
        </div>
      </div>
      {loading ? "" : ""}
      {/* <p className="py-4">{textFromSpeech}</p>
      <p className="py-4">
        caption: {tiktokData.data === null ? "null" : tiktokData.data.desc}
      </p>
      <p>locations:</p>
      <p>{locations}</p> */}
    </div>
  );
}
