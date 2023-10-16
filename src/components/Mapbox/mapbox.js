import React, { useRef, useEffect, useState } from "react";
import { withRouter } from "next/router";

import mapboxgl from "mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import styles from "../../styles/mapbox.module.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { makePostRequest } from "../../lib/api";
import { isMobile } from "react-device-detect";
import posthog from "posthog-js";


//Mapbox API Token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function Mapbox(props) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [toggleDetail, setToggleDetail] = useState(false);
  const [toggleIndex, setToggleIndex] = useState(0);
  const [lng, setLng] = useState(-122.2679252);
  const [lat, setLat] = useState(37.5593266);
  const [zoom, setZoom] = useState(7);
  const [details, setDetails] = useState([]);
  const [destinationLength, setDestinationLength] = useState(0);

  const callExistLoction = async () => {
    const places = await makePostRequest("/api/queryPlacesfromQId", {
      id: props.router.query.location,
    });
    console.log(places);
    return places;
  };

  useEffect(() => {
    localStorage.setItem("path", props.router.query.location);
    const path = localStorage.getItem("path");

    console.log(props.router.query);
    const fetchSerp = async () => {
      try {
        const serpResult = await makePostRequest("/api/serp", {
          location: `${path}`, //props.router.query.location
          queryId: props.router.query.queryId,
        });
        console.log("sr length ", serpResult.result.length);
        return serpResult.result;
      } catch (error) {
        console.error(error);
      }
    };

    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/justinlee38/clmpqt0v504qv01p70r70flq2",
      center: [lng, lat],
      zoom: zoom,
    });
    map.current.on("idle", () => {
      map.current.resize();
    });
    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });

    map.current.on("load", () => {
      /* Add the data to your map as a layer */
      map.current.addSource("places", {
        type: "geojson",
        data: [],
      });
    });

    //get location serp or get from db
    if (props.router.query.exist == "exist") {
      //and turn it into geojson obj
      callExistLoction().then((featureCollection) => {
        console.log(featureCollection);
        setDestinationLength(featureCollection.features.length);
        featureCollection.features.forEach(function (store, i) {
          store.properties.id = i;
        });
        buildLocationList(featureCollection);
        addMarkers(featureCollection);
      });
    } else {
      fetchSerp().then((serpResult) => {
        setSerpResult(serpResult);
        console.log(serpResult);
        console.log(serpResult.features);
        setDestinationLength(serpResult.features.length);

        buildLocationList(serpResult);
        addMarkers(serpResult);
      });
      // if (props.router.query.exist == "exist") {

      //   setSerpResult(places);
      //   console.log(serpResult);
      // } else {

      // }
    }
  });

  function flyToStore(currentFeature) {
    map.current.flyTo({
      center: currentFeature.geometry.coordinates,
      zoom: 15,
    });
  }

  function createPopUp(currentFeature) {
    const popUps = document.getElementsByClassName(
      `${styles["mapboxgl-popup"]}`
    );
    /** Check if there is already a popup on the map and if so, remove it */
    if (popUps[0]) popUps[0].remove();

    const popup = new mapboxgl.Popup({
      closeOnClick: false,
      className: `${styles["mapboxgl-popup"]}`,
    })
      .setLngLat(currentFeature.geometry.coordinates)
      .setHTML(`<h3>${currentFeature.properties.title}</h3>`)
      .addTo(map.current);

    popup.addClassName(`${styles["mapboxgl-popup"]}`);
  }

  function buildLocationList(stores) {
    setDetails(stores.features);
    posthog?.capture("map loaded", { property: stores.features });
    for (const store of stores.features) {
      /* Add a new listing section to the sidebar. */
      const listings = document.getElementById("listings");
      const listing = listings.appendChild(document.createElement("div"));
      /* Assign a unique `id` to the listing. */
      listing.id = `listing-${store.properties.id}`;
      /* Assign the `item` class to each listing for styling. */
      listing.className = `${styles.item}`;
      /* Check is mobile */
      let imagebox = listing.appendChild(document.createElement("div"));
      imagebox.addEventListener("click", function () {
        if (isMobile) {
          setToggleDetail((toggleDetail) => !toggleDetail);
          setToggleIndex(store.properties.id);
        }
      });
      let images = JSON.parse(store.properties.images);
      if (images) {
        console.log("images");
        console.log(images);
        if (isMobile) {
          imagebox.innerHTML = `<div class="imagebox" 
          style="background-size:cover;
          background-position:center;
          border-radius:30px;
          height:200px;
          background-image:url(${
            images[0] ? images[0]?.original : images.original
          });">`;
        } else {
          imagebox.innerHTML = `<img style="border-radius: 30px" src=\"${
            images[0] ? images[0]?.original : images.original
          }" width=\"100%\" height=\"200px\">`;
        }

        imagebox.className = `${styles.imagebox}`;
      }

      /* Add the link to the individual listing created above. */
      const link = listing.appendChild(document.createElement("a"));
      link.href = "#";
      link.className = `${styles.title}`;
      link.id = `link-${store.properties.id}`;
      link.innerHTML = `${store.properties.title}`;

      /* Add details to the individual listing. */
      if (!isMobile) {
        const details = listing.appendChild(document.createElement("div"));
        details.className = `${styles.itemdetails}`;
        // details.innerHTML = `${store.properties.city} · `;
        if (store.properties.permanently_closed) {
          details.innerHTML += `<div>This place is permanently closed!!!</div>`;
        } else {
          if (store.properties.distance) {
            const roundedDistance =
              Math.round(store.properties.distance * 100) / 100;
            details.innerHTML += `<div><strong>${roundedDistance} miles away</strong></div>`;
          }
          if (store.properties.externalLinks.website) {
            details.innerHTML += `<a style="text-decoration:none;" href=${store.properties.externalLinks.website}><img width="18px" height="18px" src="/logo/Globe.svg"/></a>&nbsp;`;
          }
          if (store.properties.externalLinks.googlemap) {
            details.innerHTML += `<a style="text-decoration:none" href=${store.properties.externalLinks.googlemap}><img width="18px" height="18px" src="/logo/Map.svg"/></a>`;
          }
          // if (store.properties.type) {
          //   details.innerHTML += `<div>${store.properties.type}</div>`;
          // }
          if (store.properties.description) {
            details.innerHTML += `<div>${store.properties.description}</div>`;
          }
          if (store.properties.price) {
            details.innerHTML += `<div><strong>${store.properties.price}</strong></div>`;
          }
          if (store.properties.rating && store.properties.reviewCount) {
            details.innerHTML += `<div><strong>${store.properties.rating} ⭐️ (${store.properties.reviewCount})</strong></div>`;
          }
          // if (store.properties.address) {
          //   details.innerHTML += `<div><strong>${store.properties.address}</strong></div>`;
          // }
          if (store.properties.timeSpend) {
            details.innerHTML += `<div><strong>People normally spend ${store.properties.timeSpend}</strong></div>`;
          }

          if (store.properties.phone) {
            details.innerHTML += `${store.properties.phone}`;
          }
        }
      }

      link.addEventListener("mouseover", function () {
        for (const feature of stores.features) {
          if (this.id === `link-${feature.properties.id}`) {
            flyToStore(feature);
            createPopUp(feature);
          }
        }
        const activeItem = document.getElementsByClassName(`${styles.active}`);
        if (activeItem[0]) {
          activeItem[0].classList.remove(`${styles.active}`);
        }
        this.parentNode.classList.add(`${styles.active}`);
      });
    }
  }

  useEffect(() => {
    console.log(toggleDetail, toggleIndex, details);
  }, [toggleDetail, toggleIndex, details]);

  function addMarkers(data) {
    /* For each feature in the GeoJSON object above: */
    for (const marker of data.features) {
      /* Create a div element for the marker. */
      const el = document.createElement("div");
      /* Assign a unique `id` to the marker. */
      el.id = `marker-${marker.properties.id}`;
      /* Assign the `marker` class to each marker for styling. */
      // console.log(data.marker);
      // console.log("emoji ", `${marker.properties.emojiType}`);
      el.innerHTML += `${marker.properties.emojiType}`;
      el.style.cssText =
        "text-indent:17.5px;font-size: 20px;line-height: 35px;";

      el.className = `${styles.marker}`;

      el.addEventListener("click", (e) => {
        /* Fly to the point */
        flyToStore(marker);
        /* Close all other popups and display popup for clicked store */
        createPopUp(marker);
        /* Highlight listing in sidebar */
        const activeItem = document.getElementsByClassName(`${styles.active}`);
        e.stopPropagation();
        if (activeItem[0]) {
          activeItem[0].classList.remove(`${styles.active}`);
        }
        const listing = document.getElementById(
          `listing-${marker.properties.id}`
        );
        listing.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "center",
        });
        listing.classList.add(`${styles.active}`);
      });
      /**
       * Create a marker using the div element
       * defined above and add it to the map.
       **/
      new mapboxgl.Marker(el, { offset: [0, -23] })
        .setLngLat(marker.geometry.coordinates)
        .addTo(map.current);
    }
  }

  return (
    <div className={styles.mapbox}>
      <div
        className={`${toggleDetail ? styles.sidebar_detail : styles.sidebar}`}
      >
        <div className={styles.heading}>
          <p>
            {toggleDetail && (
              <span
                onClick={() => {
                  setToggleDetail((toggleDetail) => !toggleDetail);
                }}
              >
                x
              </span>
            )}
          </p>
          <p>{destinationLength} destinations</p>
          {!toggleDetail ? (
            <img src="/logo/Share.svg" width={"16px"} height={"16px"} />
          ) : (
            <p></p>
          )}
        </div>

        {toggleDetail && (
          <div
            id="details-view"
            style={{
              height: "750px",
              zIndex: 10,
              position: "absolute",
              background: "white",
            }}
          >
            {/* {
              (document.getElementById(
                `listing-${details[toggleIndex].properties.id}`
              ).style.display = "none")
            } */}
            <img
              width="100%"
              height="200px"
              style={{
                borderRadius: "0 0 16px 16px",
              }}
              onClick={() => {
                setToggleDetail((toggleDetail) => !toggleDetail);
                document.getElementById("details-view").scrollTo(0, 0);
              }}
              src={
                JSON.parse(details[toggleIndex].properties.images)[0].original
              }
            />
            <div
              style={{ padding: "1rem", fontFamily: "Space Grotesk" }}
              className="details-content"
            >
              <h1
                style={{
                  fontSize: "1.25rem",
                }}
              >
                {details[toggleIndex].properties.title}
              </h1>
              <p>
                {details[toggleIndex].properties.emojiType}{" "}
                {Array.isArray(details[toggleIndex].properties.type)
                  ? details[toggleIndex].properties.type[0]
                  : details[toggleIndex].properties.type}
              </p>
              <div class="detail-logo-container">
                <span class="group">
                  <a
                    target="_blank"
                    href={details[toggleIndex].properties.externalLinks.website}
                  >
                    <img class="world-net" src="/logo/Globe.svg" />
                  </a>
                  &nbsp;&nbsp;
                  <a
                    target="_blank"
                    href={
                      details[toggleIndex].properties.externalLinks.googlemap
                    }
                  >
                    <img class="world-net" src="/logo/Map.svg" />
                  </a>
                </span>
              </div>
              <p style={{ color: "#000", fontWeight: "normal" }}>
                {details[toggleIndex].properties.description}
              </p>
              <span>
                {[
                  ...Array(Math.round(details[toggleIndex].properties.rating)),
                ].map((elementInArray, index) => (
                  <span className="" key={index}>
                    ⭐️
                  </span>
                ))}
                (
                {`${details[toggleIndex].properties.reviewCount.toLocaleString(
                  "en-GB"
                )}`}
                ) - {details[toggleIndex].properties.price}{" "}
              </span>
              {details[toggleIndex].properties.phone}
              <p style={{ fontSize: "0.8rem" }}>
                {`People normally spend ${details[toggleIndex].properties.timeSpend}`}
              </p>
              <p style={{ fontSize: "1rem" }}>
                {details[toggleIndex].properties.address}
              </p>
            </div>
          </div>
        )}
        <div>
          <div id="listings" className={styles.listings}></div>
        </div>
      </div>
      <div ref={mapContainer} className={styles.map}></div>
    </div>
  );
}

export default withRouter(Mapbox);
