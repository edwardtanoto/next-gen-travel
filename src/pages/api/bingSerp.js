const SerpApi = require("google-search-results-nodejs");
const search = new SerpApi.GoogleSearch(process.env.SERP_API_KEY);
const fs = require("fs");

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const params = {
        engine: "bing",
        q: "fogo de chao san francisco",
        safeSearch: "strict",
        first: "20",
        count: "30",
      };

      const callback = function (data) {
        console.log(data);
        fs.writeFileSync("serpOutput.txt", JSON.stringify(data, null, 4));
        console.log("done");
      };

      // Show result as JSON
      return search.json(params, callback);
    } catch (err) {
      res.status(500).json({ error: "failed to load data" });
    }
  } else {
  }
}
