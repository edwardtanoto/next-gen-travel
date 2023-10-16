const createConnectionPool = require("@databases/pg");
const { sql } = require("@databases/pg");
const db = createConnectionPool();

async function insertPlace(db, geojsonFeatureObj, query_id) {
  console.log("in db images");
  console.log(geojsonFeatureObj.properties.title);
  console.log(geojsonFeatureObj.properties.images);

  try {
    const placeResult = await db.query(sql`
  INSERT INTO places (
    longitude, 
    latitude, 
    title, 
    type, 
    description, 
    price, 
    rating, 
    review_count, 
    phone, 
    address, 
    time_spend, 
    permanently_closed, 
    emoji_type,
    images,
    hours,
    query_id,
    time_created
  ) 
  VALUES (
    ${geojsonFeatureObj.geometry.coordinates[1]}, 
    ${geojsonFeatureObj.geometry.coordinates[0]}, 
    ${geojsonFeatureObj.properties.title}, 
    ${geojsonFeatureObj.properties.type}, 
    ${geojsonFeatureObj.properties.description}, 
    ${geojsonFeatureObj.properties.price}, 
    ${geojsonFeatureObj.properties.rating}, 
    ${geojsonFeatureObj.properties.reviewCount}, 
    ${geojsonFeatureObj.properties.phone}, 
    ${geojsonFeatureObj.properties.address}, 
    ${geojsonFeatureObj.properties.timeSpend},
    ${geojsonFeatureObj.properties.permanently_closed},
    ${geojsonFeatureObj.properties.emojiType},
    ${geojsonFeatureObj.properties.images},
    ${geojsonFeatureObj.properties.hours},
    ${query_id},
    NOW()) 
  RETURNING id
  `);
    //do not exist in db
    //queryId (tiktok or insta id)
    console.log(placeResult);
    if (placeResult && placeResult[0]) {
      const placeId = placeResult[0].id;
      console.log(placeId);
      await db.query(
        sql`
            INSERT INTO externallinks (
              place_id,
              website,
              googlemap,
              time_created
            )
            VALUES (
              ${placeId},
              ${geojsonFeatureObj.properties.externalLinks.website},
              ${geojsonFeatureObj.properties.externalLinks.googlemap},
              NOW()
            )
            `
      );
    }
  } catch (err) {
    console.log(err);
  }
}

async function getQueryIdFromLinkId(db, queryObj) {
  // Check if link_id already exists
  const existingLink = await db.query(sql`
    SELECT id FROM query WHERE link_id = ${queryObj.link_id}
  `);
  console.log(existingLink);

  if (existingLink.length > 0) {
    console.log("link_id already exists");
    return { query_id: existingLink[0].id, exist: "exist" };
  }

  const queryResult = await db.query(sql`
  INSERT INTO query (
    link_id,
    url,
    time_created
  ) 
  VALUES (
    ${queryObj.link_id}, 
    ${queryObj.url}, 
    NOW()
  ) 
  RETURNING id
  `);
  console.log("link_id doesnot exist");

  console.log(queryResult);

  return { query_id: queryResult, exist: "new" };
}

async function getPlacesByQueryId(db, query_id) {
  const places = await db.query(sql`
    SELECT 
      longitude, 
      latitude, 
      title, 
      type, 
      description, 
      price, 
      rating, 
      review_count, 
      phone, 
      address, 
      time_spend, 
      permanently_closed, 
      emoji_type,
      images,
      hours,
      query_id,
      time_created 
    FROM places 
    WHERE query_id = ${query_id}
  `);

  if (places.rowCount === 0) {
    console.log("No places found for the provided query_id");
    return [];
  }

  console.log("Places found:", places.rows);
  return places.rows;
}

async function getPlaceDetails(placeId) {
  const sql = `
      SELECT 
          Places.*,
          ExternalLinks.yelp,
          ExternalLinks.tripadvisor,
          ExternalLinks.uber,
          ExternalLinks.lyft,
          ExternalLinks.menu,
          ExternalLinks.website,
          ExternalLinks.googlemap
      FROM 
          Places
      INNER JOIN 
          ExternalLinks ON Places.id = ExternalLinks.place_id
      WHERE 
          Places.id = $1;
    `;

  try {
    const result = await db.query(sql, [placeId]);
    return result;
  } catch (error) {
    console.error("Error fetching place details:", error);
    throw error;
  }
}

// // Here's how you could use it
// const placeId = 1; // Replace with the desired place ID
// getPlaceDetails(placeId)
//   .then((details) => {
//     console.log(details);
//   })
//   .catch((error) => {
//     console.error("Error:", error);
//   });

module.exports = {
  db,
  insertPlace,
  getPlaceDetails,
  getQueryIdFromLinkId,
  getPlacesByQueryId,
};
