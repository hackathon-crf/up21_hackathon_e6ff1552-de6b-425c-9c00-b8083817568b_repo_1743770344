import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";

// Instead of using the connection string directly, we'll parse it manually
// to avoid the URL parsing errors
function parseConnectionString(connectionString: string) {
  try {
    console.log("Manually parsing database connection string");
    
    // Log the masked connection string for debugging (hide password)
    const maskedConnString = connectionString.replace(/:[^@]+@/, ":********@");
    console.log("Connection string format (masked):", maskedConnString);
    
    // Extract components using regex to avoid URL parsing
    // Format: postgresql://username:password@host:port/database
    const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = connectionString.match(regex);
    
    if (!match) {
      console.error("Regex match failed. Connection string doesn't match expected format.");
      throw new Error("Invalid connection string format");
    }
    
    // Extract connection parameters without decoding
    const [, username, encodedPassword, host, port, database] = match;
    
    // Log each extracted parameter (mask password)
    console.log("Extracted connection parameters:");
    console.log("- Username:", username);
    console.log("- Password:", encodedPassword.length > 0 ? "********" : "empty");
    console.log("- Password length:", encodedPassword.length);
    console.log("- Host:", host);
    console.log("- Port:", port);
    console.log("- Database:", database);
    
    // Check specifically for problematic characters in password
    if (encodedPassword.includes("%")) {
      console.log("Warning: Password contains '%' character which may need special handling");
    }
    
    // Return the parsed components (without decoding the password)
    return {
      username,
      password: encodedPassword, // Keep as-is, no decoding
      host,
      port: parseInt(port, 10),
      database
    };
  } catch (error) {
    console.error("Error parsing connection string:", error);
    throw error;
  }
}

// Parse connection params instead of using raw connection string
let sqlClient: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

try {
  console.log("Initializing database connection");
  
  // Get connection parameters
  const connectionParams = parseConnectionString(env.DATABASE_URL);
  console.log("Successfully parsed connection parameters");
  
  // Set connection options
  const connectionOptions = {
    host: connectionParams.host,
    port: connectionParams.port,
    database: connectionParams.database,
    user: connectionParams.username,
    pass: connectionParams.password, // Use the password as-is, without decoding
    max: 1,
    ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    idle_timeout: 20,
    connect_timeout: 10,
  };
  
  console.log("Creating postgres connection with parsed parameters");
  
  // Create connection directly with parameters instead of connection string
  sqlClient = postgres({
    ...connectionOptions
  });
  
  console.log("Postgres connection created successfully");
  
  // Create the ORM instance
  dbInstance = drizzle(sqlClient);
  
  console.log("Database connection initialized successfully");
} catch (error) {
  console.error("Failed to initialize database connection:", error);
  console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
  console.error("Error message:", error instanceof Error ? error.message : String(error));
  console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace available");
}

// Export the database client and ORM instance
export const sql = sqlClient || (() => {
  throw new Error("Database connection failed. Please check your DATABASE_URL.");
}) as unknown as ReturnType<typeof postgres>;

export const db = dbInstance || (() => {
  throw new Error("Database connection failed. Please check your DATABASE_URL.");
}) as unknown as ReturnType<typeof drizzle>;