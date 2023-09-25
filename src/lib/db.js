const createConnectionPool = require("@databases/pg");
const { sql } = require("@databases/pg");

const db = createConnectionPool();

async function insertPlace(db, geojsonFeatureObj) {
  const sql = `
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
      ${null},
      ${null}, 
      NOW()) 
    RETURNING id
    `;

  const placeResult = await db.query(sql);
  console.log(placeResult);
  if (placeResult && placeResult.rows && placeResult.rows[0]) {
    const placeId = placeResult.rows[0].id;

    await db.query(
      `
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

  await db.dispose();
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

module.exports = { db, insertPlace, getPlaceDetails };
