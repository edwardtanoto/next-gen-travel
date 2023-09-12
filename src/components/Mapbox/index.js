import React, { useRef, useEffect, useState } from "react";
import { withRouter } from "next/router";

import mapboxgl from "mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import styles from "../../styles/mapbox.module.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { stores } from "./stores.js";
import { makePostRequest } from "../../lib/api";

//Mapbox API Token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function Mapbox(props) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-122.2679252);
  const [lat, setLat] = useState(37.5593266);
  const [serpData, setSerpData] = useState();
  const [zoom, setZoom] = useState(7);

  useEffect(() => {
    console.log(props.router.query.location);
    const fetchSerp = async () => {
      try {
        const serpResult = await makePostRequest(
          "http://localhost:3001/api/serp",
          props.router.query.location
        );
        console.log(serpResult);
        setSerpData(serpResult.result);
        return serpResult.result;
      } catch (error) {
        console.error(error);
      }
    };

    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });

    fetchSerp().then((serpResult) => {
      console.log(serpResult.features);
      serpResult.features.forEach(function (store, i) {
        store.properties.id = i;
      });

      map.current.on("load", () => {
        /* Add the data to your map as a layer */
        map.current.addSource("places", {
          type: "geojson",
          data: serpResult,
        });

        buildLocationList(serpResult);
        addMarkers(serpResult);
      });
    });

    // map.current.on("click", (event: any) => {
    //   /* Determine if a feature in the "locations" layer exists at that point. */
    //   const features = map.current.queryRenderedFeatures(event.point, {
    //     layers: ["locations"],
    //   });

    //   /* If it does not exist, return */
    //   if (!features.length) return;

    //   const clickedPoint = features[0];

    //   /* Fly to the point */
    //   flyToStore(clickedPoint);

    //   /* Close all other popups and display popup for clicked store */
    //   createPopUp(clickedPoint);

    //   /* Highlight listing in sidebar (and remove highlight for all other listings) */
    //   const activeItem = document.getElementsByClassName(`${styles.active}`);
    //   if (activeItem[0]) {
    //     activeItem[0].classList.remove(`${styles.active}`);
    //   }
    //   const listing = document.getElementById(
    //     `listing-${clickedPoint.properties.id}`
    //   );
    //   listing.classList.add(`${styles.active}`);
    // });
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
      .setHTML(
        `<h3>${currentFeature.properties.title}</h3><h4>${currentFeature.properties.address}</h4>`
      )
      .addTo(map.current);

    popup.addClassName(`${styles["mapboxgl-popup"]}`);
  }

  function buildLocationList(stores) {
    for (const store of stores.features) {
      /* Add a new listing section to the sidebar. */
      const listings = document.getElementById("listings");
      const listing = listings.appendChild(document.createElement("div"));
      /* Assign a unique `id` to the listing. */
      listing.id = `listing-${store.properties.id}`;
      /* Assign the `item` class to each listing for styling. */
      listing.className = `${styles.item}`;

      /* Add the link to the individual listing created above. */
      const link = listing.appendChild(document.createElement("a"));
      link.href = "#";
      link.className = `${styles.title}`;
      link.id = `link-${store.properties.id}`;
      link.innerHTML = `${store.properties.title}`;

      /* Add details to the individual listing. */
      const details = listing.appendChild(document.createElement("div"));
      // details.innerHTML = `${store.properties.city} · `;
      if (store.properties.phone) {
        details.innerHTML += `${store.properties.phoneFormatted}`;
      }
      if (store.properties.distance) {
        const roundedDistance =
          Math.round(store.properties.distance * 100) / 100;
        details.innerHTML += `<div><strong>${roundedDistance} miles away</strong></div>`;
      }

      link.addEventListener("click", function () {
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

  function addMarkers(data) {
    /* For each feature in the GeoJSON object above: */
    for (const marker of data.features) {
      /* Create a div element for the marker. */
      const el = document.createElement("div");
      /* Assign a unique `id` to the marker. */
      el.id = `marker-${marker.properties.id}`;
      /* Assign the `marker` class to each marker for styling. */
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
      <div className={styles.sidebar}>
        <div className={styles.heading}>
          <h1>Our locations</h1>
        </div>
        <div id="listings" className={styles.listings}></div>
      </div>
      <div ref={mapContainer} className={styles.map}></div>
    </div>
  );
}

export default withRouter(Mapbox);
