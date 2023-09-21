import { Client } from "pg";

let client;

if (!client) {
  client = new Client({
    host: process.env.PGSQL_HOST,
    port: process.env.PGSQL_PORT,
    database: process.env.PGSQL_DATABASE,
    user: process.env.PGSQL_USER,
    password: process.env.PGSQL_PASSWORD,
  });
}

export default client;
