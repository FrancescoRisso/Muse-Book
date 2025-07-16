import { Database } from "sqlite3";

// The environment variable is used to determine which database to use.
// If the environment variable is not set, the development database is used.
// A separate database needs to be used for testing to avoid corrupting the development database and ensuring a clean state for each test.

//The environment variable is set in the package.json file in the test script.
let env = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : "development";

// The database file path is determined based on the environment variable.
const dbFilePath = env === "test" ? "db/test.db" : "db/db.db";

// The database is created and the foreign keys are enabled.
const db: Database = new Database(dbFilePath, (err: Error | null) => {
	if (err) throw err;
});

export default db;
