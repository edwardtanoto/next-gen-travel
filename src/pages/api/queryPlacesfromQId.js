// pages/api/queryVideoId.js
import { db, insertQuery } from "./../../lib/db";
const { sql } = require("@databases/pg");

// import {withDatabase} from '../../middleware/database';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end(); // Method Not Allowed
  }
  const queryId = req.body.id;
  console.log(queryId);

  if (!queryId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const places = await db.query(sql`
    SELECT * FROM places WHERE query_id = ${queryId}
  `);

    if (places.length > 0) {
      console.log(places);
      const featureCollection = {
        type: "FeatureCollection",
        features: [],
      };
      places.forEach((place) => {
        let feature = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [place.latitude, place.longitude],
          },
          properties: {
            title: place.title,
            type: place.type,
            description: place.description,
            emojiType: place.emoji_type,
            price: place.price,
            rating: place.rating,
            reviewCount: place.review_count,
            hours: place.hours,
            phone: place.phone,
            address: place.address,
            timeSpend: place.time_spend,
            permanently_closed: place.permanently_closed,
            externalLinks: [],
            images: JSON.stringify(place.images),
          },
        };
        featureCollection.features.push(feature);
      });
      console.log(featureCollection);
      return res.json(featureCollection);
    } else {
      return res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching places data" });
  }
}

// export default withDatabase(handler);
