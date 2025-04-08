import type { Config } from "drizzle-kit";

import { env } from "~/env";

export default {
	schema: "./src/server/db/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
	// No table prefix filter needed since we're not using prefixes
	// tablesFilter: ["*"],
} satisfies Config;
