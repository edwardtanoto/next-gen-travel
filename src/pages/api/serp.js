import serpOutput from "../../../dummyData/serpOutput.json";
const SerpApi = require("google-search-results-nodejs");
const search = new SerpApi.GoogleSearch(process.env.SERP_API_KEY);

const params = {
  q: "",
  location: "San Francisco, California, United States",
  hl: "en",
  gl: "us",
  google_domain: "google.com",
};

const getSerpResult = (item) => {
  return new Promise((resolve) => {
    search.json({ params, q: item }, resolve);
  });
};

const getMultiSerpResult = async (locations) => {
  console.log(locations);
  var serpResult = [];
  var promises = locations.map(async (item) => {
    console.log("item");
    console.log(item);

    const json = await getSerpResult(item);
    serpResult.push(json);
    console.log("pushedSerp");

    // Show result as JSON
  });

  return Promise.all(promises).then(function (values) {
    console.log(values);
    console.log(serpResult);
    // fs.writeFileSync("serpOutput.txt", JSON.stringify(serpResult, null, 4));
    return serpResult;
  });
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      // console.log(serpOutput);
      console.log("Google");
      //   console.log(req.body);
      //   const serpOutput = await getMultiSerpResult(req.body);
      console.log("Google2");
      //   console.log(serpOutput);
      const serpToMapboxDetail = addMapboxDetail(serpOutput);
      const result = addGeojsonDetail(serpToMapboxDetail);
      console.log("send details to local");
      res.status(200).json({ result });
    } catch (err) {
      res.status(500).json({ error: "failed to load data" });
    }
  } else {
  }
}

const addMapboxDetail = (data) => {
  // the callback. Use a better name
  console.log("test");
  //   console.log(data);

  // setGoogleList(data);
  //   console.log(data);
  var tempListArr = [];

  data.forEach((item, index) => {
    // console.log(item);
    if (
      item.knowledge_graph &&
      item.knowledge_graph.local_map &&
      item.knowledge_graph.local_map.gps_coordinates &&
      item.knowledge_graph.local_map.gps_coordinates.longitude
    ) {
      const mapboxDetail = {
        bearing: 0,
        center: [
          item.knowledge_graph.local_map.gps_coordinates.longitude,
          item.knowledge_graph.local_map.gps_coordinates.latitude,
        ],
        zoom: 14,
        speed: 1,
        pitch: 0,
      };
      item.knowledge_graph = {
        ...item.knowledge_graph,
        mapbox: mapboxDetail,
      };
      //   console.log(item.knowledge_graph);
      tempListArr.push(item);

      // geojsonList.features.push(geojsonFeature);
    }
  });
  //   console.log(tempListArr);
  console.log("in tempList");
  //   console.log(tempListArr);
  return tempListArr;
};

const addGeojsonDetail = (tempData) => {
  var geojsonFeatureCollectionObj = {
    type: "FeatureCollection",
    features: [],
  };

  tempData.forEach((item, index) => {
    var geojsonFeatureObj = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [
          item.knowledge_graph.mapbox.center[0],
          item.knowledge_graph.mapbox.center[1],
        ],
      },
      properties: {
        title: item.knowledge_graph.title ? item.knowledge_graph.title : "",
        type: item.knowledge_graph.type ? item.knowledge_graph.type : "",
        description: item.knowledge_graph.description
          ? item.knowledge_graph.description
          : "",
        // emojiType: ,
        price: item.knowledge_graph.price ? item.knowledge_graph.price : "",
        rating: item.knowledge_graph.rating ? item.knowledge_graph.rating : "",
        reviewCount: item.knowledge_graph.review_count
          ? item.knowledge_graph.review_count
          : "",
        hours: item.knowledge_graph.hours ? item.knowledge_graph.hours : "",
        phone: item.knowledge_graph.phone ? item.knowledge_graph.phone : "",
        address: item.knowledge_graph.address
          ? item.knowledge_graph.address
          : "",
        timeSpend:
          item.knowledge_graph.popular_times &&
          item.knowledge_graph.popular_times.typical_time_spent
            ? item.knowledge_graph.popular_times.typical_time_spent
            : "",
        permanently_closed: item.knowledge_graph.permanently_closed
          ? item.knowledge_graph.permanently_closed
          : false,

        externalLinks: {
          // yelp: ,
          // tripadvisor: ,
          // uber: ,
          // lyft: ,
          // menu: ,
          website: item.knowledge_graph.website
            ? item.knowledge_graph.website
            : "",
          googlemap: item.knowledge_graph.directions
            ? item.knowledge_graph.directions
            : "",
        },
        images: item.inline_images ? item.inline_images : "",
      },
    };
    geojsonFeatureCollectionObj.features.push(geojsonFeatureObj);
  });
  console.log("in geojson");
  //   console.log(geojsonFeatureCollectionObj);

  return geojsonFeatureCollectionObj;
};
