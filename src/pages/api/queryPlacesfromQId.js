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

    console.log(places);
    if (places.length > 0) {
      return res.json(places);
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
