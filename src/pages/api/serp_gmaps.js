const SerpApi = require("google-search-results-nodejs");
const search = new SerpApi.GoogleSearch(
  "54e43079639fb7a4002a2319e3069b029c88987853fe526504df4759ce78ca3a"
);
const fs = require("fs");
const params = {
  engine: "google_maps",
  q: "pizza",
  ll: "@40.7455096,-74.0083012,15.1z",
  type: "search",
};

const callback = function (data) {
  console.log(data["search_parameters"]);
  return data;
};

// Show result as JSON

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const result = search.json(params, callback);

      fs.writeFileSync("serpOutput_gmaps.txt", JSON.stringify(result, null, 4));

      res.status(200).json({ result });
    } catch (err) {
      res.status(500).json({ error: "failed to load data" });
    }
  } else {
  }
}
