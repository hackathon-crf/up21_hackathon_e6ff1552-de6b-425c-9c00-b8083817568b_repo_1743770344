import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "~/env";

// Import the schema for querying
import * as schema from "./schema";

// Global connection state tracking
let connectionAttempts = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Create connection with retry logic
async function createConnection() {
	while (connectionAttempts < MAX_RETRIES) {
		try {
			connectionAttempts++;
			console.log(
				`[DB] Initializing database connection (attempt ${connectionAttempts}/${MAX_RETRIES})`,
			);

			// Ensure DATABASE_URL is defined
			if (!env.DATABASE_URL) {
				throw new Error("DATABASE_URL environment variable is not defined");
			}

			console.log("[DB] Creating postgres client");

			// Let postgres handle the connection string parsing directly
			const sqlClient = postgres(env.DATABASE_URL, {
				max: 3, // Number of connections
				idle_timeout: 30, // Seconds to close idle connections
				connect_timeout: 15, // Seconds to attempt connection before failing
				ssl:
					env.NODE_ENV === "production"
						? { rejectUnauthorized: false }
						: undefined,
			});

			// Test the connection immediately with a simple query
			const testResult = await sqlClient`SELECT 1 AS test`;
			console.log(
				"[DB] Connection test successful:",
				testResult[0]?.test === 1,
			);

			// Create the Drizzle ORM instance with query support
			const dbInstance = drizzle(sqlClient, { schema });
			console.log("[DB] Database connection initialized successfully");

			return { sql: sqlClient, db: dbInstance };
		} catch (error) {
			console.error(
				`[DB] Failed to initialize database connection (attempt ${connectionAttempts}/${MAX_RETRIES}):`,
				error,
			);

			if (connectionAttempts < MAX_RETRIES) {
				console.log(`[DB] Retrying in ${RETRY_DELAY}ms...`);
				// Wait before retrying
				await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
			} else {
				console.error(
					"[DB] Max retries reached. Database initialization failed.",
				);
				throw error;
			}
		}
	}

	// If we reached here, all attempts failed
	throw new Error(
		`Failed to initialize database connection after ${MAX_RETRIES} attempts`,
	);
}

// Singleton pattern - only create one connection
let connectionPromise: Promise<{
	sql: ReturnType<typeof postgres>;
	db: PostgresJsDatabase<typeof schema>;
}> | null = null;

// Get or create the database connection
function getConnection() {
	// Only create the connection once
	if (!connectionPromise) {
		connectionPromise = createConnection().catch((err) => {
			// Reset the promise on failure so next call will try again
			connectionPromise = null;
			throw err;
		});
	}
	return connectionPromise;
}

// For direct compatibility with existing code
let _db: PostgresJsDatabase<typeof schema> | null = null;

// Initialize the connection immediately
getConnection()
	.then((connection) => {
		_db = connection.db;
		console.log("[DB] Cached database connection successfully");
	})
	.catch((err) => {
		console.error("[DB] Failed to cache database connection:", err);
	});

// Public API: export the database client with proper error handling
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
	get: (_target, prop) => {
		if (!_db) {
			console.error("[DB] Accessing db before connection is ready");
			throw new Error(
				"Database connection is not yet initialized. Please ensure the connection is established.",
			);
		}
		return _db[prop as keyof typeof _db];
	},
});

// Export the async getter for cases where waiting for the connection is needed
export async function getDb() {
	const connection = await getConnection();
	return connection.db;
}

// Optionally export SQL for raw queries if needed
export const sql = async () => {
	const connection = await getConnection();
	return connection.sql;
};
