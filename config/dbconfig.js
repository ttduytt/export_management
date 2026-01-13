import dotenv from "dotenv";
import mariadb from "mariadb";
import { createClient } from "redis"

dotenv.config();

const reddisClient = createClient();
await reddisClient.connect().catch(console.error);

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.PORT_DB,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  dateStrings: true,
});

export default pool;
