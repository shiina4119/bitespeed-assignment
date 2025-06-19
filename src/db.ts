import config from "./config.ts";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: config.dbUrl,
});
const db = drizzle({ client: pool });

export default db;
