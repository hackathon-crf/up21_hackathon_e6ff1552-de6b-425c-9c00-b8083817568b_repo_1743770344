import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
	conn: postgres.Sql | undefined;
};

// Parse the connection info manually to avoid URI decoding issues
const connectionInfo = {
  host: 'db.vlorxemqazphblreeyht.supabase.co',
  port: 5432,
  database: 'postgres', 
  username: 'postgres',
  password: 'Tmx8Suvr4KmqJ%'
};

// Create connection with separate parameters instead of URL string
const conn = globalForDb.conn ?? postgres({
  host: connectionInfo.host,
  port: connectionInfo.port,
  database: connectionInfo.database,
  username: connectionInfo.username,
  password: connectionInfo.password,
  ssl: env.NODE_ENV === 'production' 
    ? true  // In production, use proper SSL
    : {
        rejectUnauthorized: false, // Disable SSL verification in development
      },
  connect_timeout: 10, // 10 second connection timeout
  idle_timeout: 30, // 30 seconds to be idle before closing connection
  max_lifetime: 60 * 30, // Connection can live max 30 minutes
  max: 10, // max 10 connections
});

if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
