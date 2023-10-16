// pages/api/queryVideoId.js
import { db, getQueryIdFromLinkId } from "./../../lib/db";
const { sql } = require("@databases/pg");

// import {withDatabase} from '../../middleware/database';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end(); // Method Not Allowed
  }
  const linkedId = req.body.link_id;
  console.log(linkedId);

  if (!linkedId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    console.log("in QueryVideoId");

    const queryId = await getQueryIdFromLinkId(db, req.body);
    //     console.log(queryId.query_id);

    //     const user = await db.query(sql`
    //     SELECT * FROM query WHERE id = ${queryId.query_id}
    //   `);
    console.log("queryId");

    console.log(queryId);
    if (queryId) {
      return res.json(queryId);
    } else {
      return res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching user data" });
  }
}

// export default withDatabase(handler);
