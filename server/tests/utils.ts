import db from "../db/db";
import fs from "node:fs";

const clearDBquery = fs.readFileSync("db/db-creation-script.sqlite3", "utf8");

export const clearDB = () => {
	return new Promise<void>((res, rej) => {
		db.exec(clearDBquery, (err: any) => {
			return err ? rej() : res();
		});
	});
};
