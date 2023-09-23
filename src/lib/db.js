const createConnectionPool = require("@databases/pg");

const db = createConnectionPool();
module.exports = db;
