// import serpOutput from "../../../dummyData/serpOutput.json";
const SerpApi = require("google-search-results-nodejs");
const search = new SerpApi.GoogleSearch(process.env.SERP_API_KEY);
const fs = require("fs");
const google_params = {
  q: "",
  location: "San Francisco, California, United States",
  hl: "en",
  gl: "us",
  google_domain: "google.com",
};

const gmaps_params = {
  engine: "google_maps",
  q: "",
  ll: "@40.7455096,-74.0083012,15.1z",
  type: "search",
  hl: "en",
};

const getSerpResult = (params, item) => {
  console.log(params);
  params.q = item[0] + item[1];
  return new Promise((resolve) => {
    search.json(params, resolve);
  });
};

const getMultiSerpResult = async (locations) => {
  console.log("locations ", locations.length);
  locations = JSON.parse(locations.replace(/'/g, '"'));
  var serpResult = [];
  var promises = locations.map(async (item) => {
    console.log("item");

    try {
      const google_json = await getSerpResult(google_params, item);
      const gmaps_json = await getSerpResult(gmaps_params, item);
      serpResult.push({ google: google_json, gmaps: gmaps_json });
      console.log("pushedSerp");
    } catch (error) {
      console.log(error);
    }

    // Show result as JSON
  });

  return Promise.all(promises).then(function (values) {
    // console.log(values);
    // console.log(serpResult);
    return serpResult;
  });
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      console.log("Google");
      //   console.log(req.body);
      const serpOutput = await getMultiSerpResult(req.body);
      console.log("Google2");
      fs.writeFileSync("serpOutput.txt", JSON.stringify(serpOutput, null, 4));

      console.log(serpOutput.length);
      const result = addMapboxDetail(serpOutput);
      console.log("send details to local " + result.features.length);

      res.status(200).json({ result });
    } catch (err) {
      res.status(500).json({ error: "failed to load data" });
    }
  } else {
  }
}

const addMapboxDetail = (data) => {
  // the callback. Use a better name
  console.log("test in add mapbox detail first line " + data.length);

  //   var tempListArr = [];
  var geojsonFeatureCollectionObj = {
    type: "FeatureCollection",
    features: [],
  };

  var geojsonFeatureObj = {};
  data.forEach((item, index) => {
    console.log(index);
    var place = {
      gps_coordinates: { longitude: 0, latitude: 0 },
      properties: {
        title: "",
        type: "",
        description: "",
        // emojiType: ,
        price: "",
        rating: "",
        reviewCount: "",
        hours: "",
        phone: "",
        address: "",
        timeSpend: "",
        permanently_closed: "",
        externalLinks: {
          website: "",
          googlemap: "",
        },
        images: "",
      },
    };
    geojsonFeatureObj = {};
    if (
      item.google.knowledge_graph &&
      item.google.knowledge_graph.local_map &&
      item.google.knowledge_graph.local_map.gps_coordinates &&
      item.google.knowledge_graph.local_map.gps_coordinates.longitude
    ) {
      console.log("enter knowledge graph map");

      place = {
        gps_coordinates: item.google.knowledge_graph.local_map.gps_coordinates,
        properties: {
          title: item.google.knowledge_graph.title
            ? item.google.knowledge_graph.title
            : "",
          type: item.google.knowledge_graph.type
            ? item.google.knowledge_graph.type
            : "",
          description: item.google.knowledge_graph.description
            ? item.google.knowledge_graph.description
            : "",
          // emojiType: ,
          price: item.google.knowledge_graph.price
            ? item.google.knowledge_graph.price
            : "",
          rating: item.google.knowledge_graph.rating
            ? item.google.knowledge_graph.rating
            : "",
          reviewCount: item.google.knowledge_graph.review_count
            ? item.google.knowledge_graph.review_count
            : "",
          hours: item.google.knowledge_graph.hours
            ? item.google.knowledge_graph.hours
            : "",
          phone: item.google.knowledge_graph.phone
            ? item.google.knowledge_graph.phone
            : "",
          address: item.google.knowledge_graph.address
            ? item.google.knowledge_graph.address
            : "",
          timeSpend:
            item.google.knowledge_graph.popular_times &&
            item.google.knowledge_graph.popular_times.typical_time_spent
              ? item.google.knowledge_graph.popular_times.typical_time_spent
              : "",
          permanently_closed: item.google.knowledge_graph.permanently_closed
            ? item.google.knowledge_graph.permanently_closed
            : false,

          externalLinks: {
            // yelp: ,
            // tripadvisor: ,
            // uber: ,
            // lyft: ,
            // menu: ,
            website: item.google.knowledge_graph.website
              ? item.google.knowledge_graph.website
              : "",
            googlemap: item.google.knowledge_graph.directions
              ? item.google.knowledge_graph.directions
              : "",
          },
          images: item.google.inline_images ? item.google.inline_images : "",
        },
      };
    } else if (
      item.google.local_results &&
      item.google.local_results.places &&
      item.google.local_results.places[0]
    ) {
      place = {
        gps_coordinates: item.google.local_results.places[0].gps_coordinates,
        properties: {
          title: item.google.local_results.places[0].title
            ? item.google.local_results.places[0].title
            : "",
          type: item.google.local_results.places[0].type
            ? item.google.local_results.places[0].type
            : "",
          description: item.google.local_results.places[0].description
            ? item.google.local_results.places[0].description
            : "",
          // emojiType: ,
          price: item.google.local_results.places[0].price
            ? item.google.local_results.places[0].price
            : "",
          rating: item.google.local_results.places[0].rating
            ? item.google.local_results.places[0].rating
            : "",
          reviewCount: item.google.local_results.places[0].reviews
            ? item.google.local_results.places[0].reviews
            : "",
          //hours: item.google.knowledge_graph.hours ? item.google.knowledge_graph.hours : "",
          phone: item.google.local_results.places[0].phone
            ? item.google.local_results.places[0].phone
            : "",
          address: item.google.local_results.places[0].address
            ? item.google.local_results.places[0].address
            : "",
          //   timeSpend:
          //     item.google.knowledge_graph.popular_times &&
          //     item.google.knowledge_graph.popular_times.typical_time_spent
          //       ? item.google.knowledge_graph.popular_times.typical_time_spent
          //       : "",
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
            //   : "",
            // googlemap: item.google.knowledge_graph.directions
            //   ? item.google.knowledge_graph.directions
            //   : "",
          },
          images: item.google.local_results.places[0].thumbnail
            ? item.google.local_results.places[0].thumbnail
            : "",
        },
      };
    } else if (item.gmaps.local_results && item.gmaps.local_results[0]) {
      place = {
        gps_coordinates: item.gmaps.local_results[0].gps_coordinates,
        properties: {
          title: item.gmaps.local_results[0].title
            ? item.gmaps.local_results[0].title
            : "",
          type: item.gmaps.local_results[0].type
            ? item.gmaps.local_results[0].type
            : "",
          description: item.gmaps.local_results[0].description
            ? item.gmaps.local_results[0].description
            : "",
          // emojiType: ,
          price: item.gmaps.local_results[0].price
            ? item.gmaps.local_results[0].price
            : "",
          rating: item.gmaps.local_results[0].rating
            ? item.gmaps.local_results[0].rating
            : "",
          reviewCount: item.gmaps.local_results[0].reviews
            ? item.gmaps.local_results[0].reviews
            : "",
          hours: item.gmaps.local_results[0].operating_hours
            ? item.gmaps.local_results[0].operating_hours
            : "",
          phone: item.gmaps.local_results[0].phone
            ? item.gmaps.local_results[0].phone
            : "",
          address: item.gmaps.local_results[0].address
            ? item.gmaps.local_results[0].address
            : "",
          //   timeSpend:
          //     item.gmaps.knowledge_graph.popular_times &&
          //     item.gmaps.knowledge_graph.popular_times.typical_time_spent
          //       ? item.gmaps.knowledge_graph.popular_times.typical_time_spent
          //       : "",
          //   permanently_closed: item.gmaps.knowledge_graph.permanently_closed
          //     ? item.gmaps.knowledge_graph.permanently_closed
          //     : false,

          externalLinks: {
            // yelp: ,
            // tripadvisor: ,
            // uber: ,
            // lyft: ,
            // menu: ,
            website: item.gmaps.local_results[0].website
              ? item.gmaps.local_results[0].website
              : "",
            googlemap: item.gmaps.local_results[0].directions
              ? item.gmaps.local_results[0].directions
              : "",
          },
          images: item.gmaps.local_results[0].thumbnail
            ? item.gmaps.local_results[0].thumbnail
            : "",
        },
      };
    } else if (item.gmaps.place_results) {
      place = {
        gps_coordinates: item.gmaps.place_results.gps_coordinates,
        properties: {
          title: item.gmaps.place_results.title
            ? item.gmaps.place_results.title
            : "",
          type: item.gmaps.place_results.type
            ? item.gmaps.place_results.type
            : "",
          description: item.gmaps.place_results.description
            ? item.gmaps.place_results.description
            : "",
          // emojiType: ,
          price: item.gmaps.place_results.price
            ? item.gmaps.place_results.price
            : "",
          rating: item.gmaps.place_results.rating
            ? item.gmaps.place_results.rating
            : "",
          reviewCount: item.gmaps.place_results.reviews
            ? item.gmaps.place_results.reviews
            : "",
          hours: item.gmaps.place_results.operating_hours
            ? item.gmaps.place_results.operating_hours
            : "",
          phone: item.gmaps.place_results.phone
            ? item.gmaps.place_results.phone
            : "",
          address: item.gmaps.place_results.address
            ? item.gmaps.place_results.address
            : "",
          //   timeSpend:
          //     item.gmaps.knowledge_graph.popular_times &&
          //     item.gmaps.knowledge_graph.popular_times.typical_time_spent
          //       ? item.gmaps.knowledge_graph.popular_times.typical_time_spent
          //       : "",
          //   permanently_closed: item.gmaps.knowledge_graph.permanently_closed
          //     ? item.gmaps.knowledge_graph.permanently_closed
          //     : false,

          externalLinks: {
            // yelp: ,
            // tripadvisor: ,
            // uber: ,
            // lyft: ,
            // menu: ,
            website: item.gmaps.place_results.website
              ? item.gmaps.place_results.website
              : "",
            googlemap: item.gmaps.place_results.directions
              ? item.gmaps.place_results.directions
              : "",
          },
          images: item.gmaps.place_results.thumbnail
            ? item.gmaps.place_results.thumbnail
            : "",
        },
      };
    }
    console.log("goes after if statement");
    geojsonFeatureObj = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [
          place.gps_coordinates.longitude,
          place.gps_coordinates.latitude,
        ],
      },
      properties: {
        title: place.properties.title,
        type: place.properties.type,
        description: place.properties.description,
        // emojiType: ,
        price: place.properties.price,
        rating: place.properties.rating,
        reviewCount: place.properties.reviewCount,
        hours: place.properties.hours,
        phone: place.properties.phone,
        address: place.properties.address,
        timeSpend: place.properties.timeSpend,
        permanently_closed: place.properties.permanently_closed,

        externalLinks: {
          // yelp: ,
          // tripadvisor: ,
          // uber: ,
          // lyft: ,
          // menu: ,
          website: place.properties.externalLinks.website,
          googlemap: place.properties.externalLinks.googlemap,
        },
        images: place.properties.images,
      },
    };

    geojsonFeatureCollectionObj.features.push(geojsonFeatureObj);
  });
  //   console.log(tempListArr);
  console.log(
    "in tempList last line" + geojsonFeatureCollectionObj.features.length
  );

  //   console.log(tempListArr);
  return geojsonFeatureCollectionObj;
};

const addGeojsonDetail = (tempData) => {
  console.log("in add geojson first line" + tempData.length);
  var geojsonFeatureCollectionObj = {
    type: "FeatureCollection",
    features: [],
  };

  tempData.forEach((item, index) => {});
  console.log("in geojson");
  console.log(geojsonFeatureCollectionObj.length);

  return geojsonFeatureCollectionObj;
};
