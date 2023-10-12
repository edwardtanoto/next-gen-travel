import serpOutput from "../../../dummyData/serpOutput.json";
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
    // const serpOutput = await getMultiSerpResult(req.body.location);
    console.log("serp");
    console.timeEnd("serp");
    console.log("Google2");
    // fs.writeFileSync("serpOutput.txt", JSON.stringify(serpOutput, null, 4));

    console.log(serpOutput.length);
    console.time("add mapbox detail");
    const result = await addMapboxDetail(serpOutput, req.body.queryId);
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
const addMapboxDetail = async (data, queryId) => {
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
    await insertPlace(db, feature, queryId).catch((err) => {
      console.error(err);
      process.exit(1);
    });
  }

  console.log("in tempList last line" + featureCollection.features.length);
  console.log(featureCollection);

  return featureCollection;
};

const extractPlaceInfo = (item) => {
  const defaultProperties = {
    title: "Japanese Toilet",
    type: "Restaurant",
    description:
      "A wonderful place to enjoy delicious meals, featuring an ambient atmosphere and friendly staff.",
    emojiType: "😊",
    price: "$$$$$",
    rating: 4.5,
    reviewCount: 123,
    hours: JSON.stringify({
      friday: {
        opens: "8 AM",
        closes: "5 PM",
      },
      monday: {
        opens: "Closed",
        closes: "Closed",
      },
      sunday: {
        opens: "8 AM",
        closes: "5 PM",
      },
      tuesday: {
        opens: "8 AM",
        closes: "5 PM",
      },
      saturday: {
        opens: "8 AM",
        closes: "5 PM",
      },
      thursday: {
        opens: "8 AM",
        closes: "5 PM",
      },
      wednesday: {
        opens: "8 AM",
        closes: "5 PM",
      },
    }),
    phone: "+1 234-567-8901",
    address: "123 Main St, Cityville, State, 12345",
    timeSpend: "1-2 hours",
    permanently_closed: false,
    externalLinks: {
      website: "https://tokyotoilet.jp/",
      googlemap: "https://maps.app.goo.gl/C1mUYhax4HZ2TbaRA",
    },
    images: JSON.stringify([
      {
        link: "https://www.google.com/search?sca_esv=567173421&hl=en&gl=us&q=Kenting+National+Park&tbm=isch&source=univ&fir=TRANyNv-SaTTgM%252CFfNoJXJw15vZPM%252C_%253BSs6CBMLMsL67uM%252Ckm9iKFd9_ItasM%252C_%253BC8QKzv6c78YRUM%252CGbfma_-W7kjvAM%252C_%253BF6ViWuqXJH26FM%252C30hO5V1QXf6QAM%252C_%253BIahhoKt8T9GlpM%252CQP8IbO5jmGk_mM%252C_%253Bd98MAOrzL2C_TM%252CbVcCCeTEqYYjHM%252C_%253BPP-ybhfFFVONBM%252ClIeiir1hXgnUZM%252C_%253B9QXwRizLMOMYaM%252CTiVnqMpx0WozlM%252C_%253BgNdcjXF5F1-7fM%252Chc1Yij8oXR6-cM%252C_%253BV7qDfaEffrkKYM%252ChvQxDVf1AgfjCM%252C_&usg=AI4_-kTYwjbIzpn19n6J_hDbJp1yn4on1A&sa=X&ved=2ahUKEwi4gNeJ9LqBAxUtEFkFHV5-CA0Q9AF6BAgWEAA#imgrc=TRANyNv-SaTTgM",
        source:
          "https://taiwan-scene.com/a-first-timers-guide-to-kenting-national-park/",
        thumbnail:
          "https://serpapi.com/searches/650bcbfa3e86acb5e6ea0169/images/7ff578c67827e255e24a56d4e77c26e180e0489bcd91cc76e0cd3176d34ff06b.jpeg",
        original:
          "https://generative-placeholders.glitch.me/image?width=600&height=300&style=joy-division",
        title: "A First Timer's Guide to Kenting National Park - Taiwan Scene",
        source_name: "Taiwan Scene",
      },
    ]),
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
        title: item.google.knowledge_graph.title || defaultProperties.title,
        type: item.google.knowledge_graph.type || defaultProperties.type,
        description:
          item.google.knowledge_graph.description ||
          defaultProperties.description,
        price: item.google.knowledge_graph.price || defaultProperties.price,
        rating: item.google.knowledge_graph.rating || defaultProperties.rating,
        reviewCount:
          item.google.knowledge_graph.review_count ||
          defaultProperties.reviewCount,
        hours:
          JSON.stringify(item.google.knowledge_graph.hours) ||
          defaultProperties.hours,
        phone: item.google.knowledge_graph.phone || defaultProperties.phone,
        address:
          item.google.knowledge_graph.address || defaultProperties.address,
        timeSpend:
          item.google.knowledge_graph.popular_times?.typical_time_spent ||
          defaultProperties.timeSpend,
        permanently_closed:
          item.google.knowledge_graph.permanently_closed || false,

        externalLinks: {
          website:
            item.google.knowledge_graph.website ||
            defaultProperties.externalLinks.website,
          googlemap:
            item.google.knowledge_graph.directions ||
            defaultProperties.externalLinks.googlemap,
        },
        images:
          JSON.stringify(item.google.inline_images) || defaultProperties.images,
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
        title:
          item.google.local_results.places[0].title || defaultProperties.title,
        type:
          item.google.local_results.places[0].type || defaultProperties.type,
        description:
          item.google.local_results.places[0].description ||
          defaultProperties.description,
        price:
          item.google.local_results.places[0].price || defaultProperties.price,
        rating:
          item.google.local_results.places[0].rating ||
          defaultProperties.rating,
        reviewCount:
          item.google.local_results.places[0].reviews ||
          defaultProperties.reviewCount,
        //hours: item.google.knowledge_graph.hours ? item.google.knowledge_graph.hours : null,
        phone:
          item.google.local_results.places[0].phone || defaultProperties.phone,
        address:
          item.google.local_results.places[0].address ||
          defaultProperties.address,
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
          // website:
          //   item.google.knowledge_graph.website ||
          //   defaultProperties.externalLinks.website,
          // googlemap:
          //   item.google.knowledge_graph.directions ||
          //   defaultProperties.externalLinks.googlemap,
        },
        images:
          defaultProperties.images ||
          item.google.local_results.places[0].thumbnail,
      },
    };
  } else if (item.gmaps.local_results && item.gmaps.local_results[0]) {
    placeInfo = {
      gps_coordinates: item.gmaps.local_results[0].gps_coordinates,
      properties: {
        ...defaultProperties,
        title: item.gmaps.local_results[0].title || defaultProperties.title,
        type: item.gmaps.local_results[0].type || defaultProperties.type,
        description:
          item.gmaps.local_results[0].description ||
          defaultProperties.description,
        price: item.gmaps.local_results[0].price || defaultProperties.price,
        rating: item.gmaps.local_results[0].rating || defaultProperties.rating,
        reviewCount:
          item.gmaps.local_results[0].reviews || defaultProperties.reviewCount,
        hours:
          JSON.stringify(item.gmaps.local_results[0].operating_hours) ||
          defaultProperties.hours,
        phone: item.gmaps.local_results[0].phone || defaultProperties.phone,
        address:
          item.gmaps.local_results[0].address || defaultProperties.address,
        //   timeSpend:
        //     item.gmaps.knowledge_graph.popular_times &&
        //     item.gmaps.knowledge_graph.popular_times.typical_time_spent
        //       ? item.gmaps.knowledge_graph.popular_times.typical_time_spent
        //       : null,
        //   permanently_closed: item.gmaps.knowledge_graph.permanently_closed
        //     ? item.gmaps.knowledge_graph.permanently_closed
        //     : false,

        externalLinks: {
          website:
            item.gmaps.local_results[0].website ||
            defaultProperties.externalLinks.website,
          googlemap:
            item.gmaps.local_results[0].directions ||
            defaultProperties.externalLinks.googlemap,
        },
        images:
          defaultProperties.images || item.gmaps.local_results[0].thumbnail,
      },
    };
  } else if (item.gmaps.place_results) {
    placeInfo = {
      gps_coordinates: item.gmaps.place_results.gps_coordinates,
      properties: {
        ...defaultProperties,

        title: item.gmaps.place_results.title || defaultProperties.title,
        type: item.gmaps.place_results.type || defaultProperties.type,
        description:
          item.gmaps.place_results.description?.snippet ||
          defaultProperties.description,
        price: item.gmaps.place_results.price || defaultProperties.price,
        rating: item.gmaps.place_results.rating || defaultProperties.rating,
        reviewCount:
          item.gmaps.place_results.reviews || defaultProperties.reviewCount,
        hours:
          JSON.stringify(item.gmaps.place_results.operating_hours) ||
          defaultProperties.hours,
        phone: item.gmaps.place_results.phone || defaultProperties.phone,
        address: item.gmaps.place_results.address || defaultProperties.address,
        //   timeSpend:
        //     item.gmaps.knowledge_graph.popular_times &&
        //     item.gmaps.knowledge_graph.popular_times.typical_time_spent
        //       ? item.gmaps.knowledge_graph.popular_times.typical_time_spent
        //       : null,
        //   permanently_closed: item.gmaps.knowledge_graph.permanently_closed
        //     ? item.gmaps.knowledge_graph.permanently_closed
        //     : false,

        externalLinks: {
          website:
            item.gmaps.place_results.website ||
            defaultProperties.externalLinks.website,
          googlemap:
            item.gmaps.place_results.directions ||
            defaultProperties.externalLinks.googlemap,
        },
        images: defaultProperties.images || item.gmaps.place_results.thumbnail,
      },
    };
  }
  console.log("placeInfo");
  console.log(placeInfo);
  return placeInfo;
};
