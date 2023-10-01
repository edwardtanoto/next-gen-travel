// import serpOutput from "../../../dummyData/serpOutput.json";
const SerpApi = require("google-search-results-nodejs");
const fs = require("fs");
const { db, insertPlace } = require("./../../lib/db");
const { makePostRequest } = require("./../../lib/api");

const search = new SerpApi.GoogleSearch(process.env.SERP_API_KEY);

// Google search parameters
const google_params = {
  q: "",
  location: "San Francisco, California, United States",
  hl: "en",
  gl: "us",
  google_domain: "google.com",
};

// Google Maps search parameters
const gmaps_params = {
  engine: "google_maps",
  q: "",
  ll: "@40.7455096,-74.0083012,15.1z",
  type: "search",
  hl: "en",
};

// Get SERP result for a given item and parameters
const getSerpResult = (params, item) => {
  console.log(params);
  params.q = item[0] + item[1];
  return new Promise((resolve) => {
    search.json(params, resolve);
  });
};

// Get multiple SERP results for given locations
const getMultiSerpResult = async (locations) => {
  locations = JSON.parse(locations.replace(/'/g, '"'));
  const serpResults = await Promise.all(
    locations.map(async (item) => {
      try {
        const googleResult = await getSerpResult(google_params, item);
        const gmapsResult = await getSerpResult(gmaps_params, item);
        return { google: googleResult, gmaps: gmapsResult };
      } catch (error) {
        console.error(error);
      }
    })
  );
  return serpResults.filter((result) => result); // Remove undefined results
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end(); // Method Not Allowed
    return;
  }

  try {
    console.time("serp");
    const serpOutput = await getMultiSerpResult(req.body);
    console.log("serp");
    console.timeEnd("serp");
    console.log("Google2");
    // fs.writeFileSync("serpOutput.txt", JSON.stringify(serpOutput, null, 4));

    console.log(serpOutput.length);
    console.time("add mapbox detail");
    const result = await addMapboxDetail(serpOutput);
    console.log("add mapbox detail");
    console.timeEnd("add mapbox detail");

    console.log("send details to local " + result.features.length);
    res.status(200).json({ result });
  } catch (err) {
    res.status(500).json({ error: "failed to load data" });
  }
}

// Match emoji for given title and description
const matchEmoji = async (title, desc) => {
  const response = await makePostRequest(
    `${process.env.URL}/api/openai_emoji`,
    { data: `${title} ${desc}` }
  );
  return response.output.choices[0].message.content;
};

// Add detailed information from Mapbox
const addMapboxDetail = async (data) => {
  // the callback. Use a better name
  console.log("test in add mapbox detail first line " + data.length);

  const featureCollection = {
    type: "FeatureCollection",
    features: [],
  };
  let feature = {};
  for (const item of data) {
    const place = extractPlaceInfo(item);
    if (!place) continue;

    try {
      place.properties.emojiType = await matchEmoji(
        place.properties.title,
        place.properties.description
      );
    } catch (err) {
      console.error("Error matching emoji:", err);
    }

    console.log("before place");
    console.log(place);
    feature = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [
          place.gps_coordinates?.longitude,
          place.gps_coordinates?.latitude,
        ],
      },
      properties: place.properties,
    };

    featureCollection.features.push(feature);
    console.log("feature collection");
    console.log(featureCollection);
    console.log(featureCollection.features);
  }
  insertPlace(db, feature).catch((err) => {
    console.error(err);
    process.exit(1);
  });
  console.log("in tempList last line" + featureCollection.features.length);
  console.log(featureCollection);

  return featureCollection;
};

const extractPlaceInfo = (item) => {
  const defaultProperties = {
    title: null,
    type: null,
    description: null,
    emojiType: null,
    price: null,
    rating: null,
    reviewCount: null,
    hours: null,
    phone: null,
    address: null,
    timeSpend: null,
    permanently_closed: null,
    externalLinks: {
      website: null,
      googlemap: null,
    },
    images: null,
  };

  let placeInfo = null;

  if (
    item.google.knowledge_graph &&
    item.google.knowledge_graph.local_map &&
    item.google.knowledge_graph.local_map.gps_coordinates &&
    item.google.knowledge_graph.local_map.gps_coordinates.longitude
  ) {
    placeInfo = {
      gps_coordinates: item.google.knowledge_graph.local_map.gps_coordinates,
      properties: {
        ...defaultProperties,
        title: item.google.knowledge_graph.title || null,
        type: item.google.knowledge_graph.type || null,
        description: item.google.knowledge_graph.description || null,
        price: item.google.knowledge_graph.price || null,
        rating: item.google.knowledge_graph.rating || null,
        reviewCount: item.google.knowledge_graph.review_count || null,
        hours: item.google.knowledge_graph.hours || null,
        phone: item.google.knowledge_graph.phone || null,
        address: item.google.knowledge_graph.address || null,
        timeSpend:
          item.google.knowledge_graph.popular_times?.typical_time_spent || null,
        permanently_closed:
          item.google.knowledge_graph.permanently_closed || false,

        externalLinks: {
          website: item.google.knowledge_graph.website || null,
          googlemap: item.google.knowledge_graph.directions || null,
        },
        images: item.google.inline_images || null,
      },
    };
  } else if (
    item.google.local_results &&
    item.google.local_results.places &&
    item.google.local_results.places[0]
  ) {
    placeInfo = {
      gps_coordinates: item.google.local_results.places[0].gps_coordinates,
      properties: {
        ...defaultProperties,
        title: item.google.local_results.places[0].title || null,
        type: item.google.local_results.places[0].type || null,
        description: item.google.local_results.places[0].description || null,
        price: item.google.local_results.places[0].price || null,
        rating: item.google.local_results.places[0].rating || null,
        reviewCount: item.google.local_results.places[0].reviews || null,
        //hours: item.google.knowledge_graph.hours ? item.google.knowledge_graph.hours : null,
        phone: item.google.local_results.places[0].phone || null,
        address: item.google.local_results.places[0].address || null,
        //   timeSpend:
        //     item.google.knowledge_graph.popular_times &&
        //     item.google.knowledge_graph.popular_times.typical_time_spent
        //       ? item.google.knowledge_graph.popular_times.typical_time_spent
        //       : null,
        //   permanently_closed: item.google.knowledge_graph.permanently_closed
        //     ? item.google.knowledge_graph.permanently_closed
        //     : false,

        externalLinks: {
          // yelp: ,
          // tripadvisor: ,
          // uber: ,
          // lyft: ,
          // menu: ,
          // website: item.google.knowledge_graph.website
          //   ? item.google.knowledge_graph.website
          //   : null,
          // googlemap: item.google.knowledge_graph.directions
          //   ? item.google.knowledge_graph.directions
          //   : null,
        },
        images: item.google.local_results.places[0].thumbnail
          ? item.google.local_results.places[0].thumbnail
          : null,
      },
    };
  } else if (item.gmaps.local_results && item.gmaps.local_results[0]) {
    placeInfo = {
      gps_coordinates: item.gmaps.local_results[0].gps_coordinates,
      properties: {
        ...defaultProperties,
        title: item.gmaps.local_results[0].title || null,
        type: item.gmaps.local_results[0].type || null,
        description: item.gmaps.local_results[0].description || null,
        price: item.gmaps.local_results[0].price || null,
        rating: item.gmaps.local_results[0].rating || null,
        reviewCount: item.gmaps.local_results[0].reviews || null,
        hours: item.gmaps.local_results[0].operating_hours || null,
        phone: item.gmaps.local_results[0].phone || null,
        address: item.gmaps.local_results[0].address || null,
        //   timeSpend:
        //     item.gmaps.knowledge_graph.popular_times &&
        //     item.gmaps.knowledge_graph.popular_times.typical_time_spent
        //       ? item.gmaps.knowledge_graph.popular_times.typical_time_spent
        //       : null,
        //   permanently_closed: item.gmaps.knowledge_graph.permanently_closed
        //     ? item.gmaps.knowledge_graph.permanently_closed
        //     : false,

        externalLinks: {
          website: item.gmaps.local_results[0].website || null,
          googlemap: item.gmaps.local_results[0].directions || null,
        },
        images: item.gmaps.local_results[0].thumbnail || null,
      },
    };
  } else if (item.gmaps.place_results) {
    placeInfo = {
      gps_coordinates: item.gmaps.place_results.gps_coordinates,
      properties: {
        ...defaultProperties,

        title: item.gmaps.place_results.title || null,
        type: item.gmaps.place_results.type || null,
        description: item.gmaps.place_results.description || null,
        price: item.gmaps.place_results.price || null,
        rating: item.gmaps.place_results.rating || null,
        reviewCount: item.gmaps.place_results.reviews || null,
        hours: item.gmaps.place_results.operating_hours || null,
        phone: item.gmaps.place_results.phone || null,
        address: item.gmaps.place_results.address || null,
        //   timeSpend:
        //     item.gmaps.knowledge_graph.popular_times &&
        //     item.gmaps.knowledge_graph.popular_times.typical_time_spent
        //       ? item.gmaps.knowledge_graph.popular_times.typical_time_spent
        //       : null,
        //   permanently_closed: item.gmaps.knowledge_graph.permanently_closed
        //     ? item.gmaps.knowledge_graph.permanently_closed
        //     : false,

        externalLinks: {
          website: item.gmaps.place_results.website || null,
          googlemap: item.gmaps.place_results.directions || null,
        },
        images: item.gmaps.place_results.thumbnail || null,
      },
    };
  }
  console.log("placeInfo");
  console.log(placeInfo);
  return placeInfo;
};
