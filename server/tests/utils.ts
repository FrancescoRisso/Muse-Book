import { createHash } from "node:crypto";
import db from "../db/db";
import fs from "node:fs";
import { app } from "..";
import request from "supertest";

const clearDBquery = fs.readFileSync("db/db-creation-script.sqlite3", "utf8");

export const clearDB = () => {
	return new Promise<void>((res, rej) => {
		db.exec(clearDBquery, (err: any) => {
			return err ? rej() : res();
		});
	});
};

export const query_db = (query: string, params: any[]): Promise<any[]> => {
	return new Promise<any[]>((resolve, reject) => {
		db.all(query, params, (err, res) => {
			if (err) reject(err);
			else resolve(res);
		});
	});
};

export const insertDefaultUser = async () => {
	const testPwd = "pwd";
	const testSalt = 123456789;
	const testHash = createHash("sha256").update(`${testPwd}${testSalt}`).digest("hex");

	const sessionDb = `
	INSERT INTO USER(Username, Salt, Hash, Email, Name, Surname, Language, OfflineData)
	VALUES("User123", ${testSalt}, "${testHash}", "user@name.com", "Mario", "Rossi", "IT", TRUE);
	`;

	return new Promise<void>((resolve, reject) => {
		db.run(sessionDb, [], (err) => (err ? reject(err) : resolve()));
	});
};

export const login = async (): Promise<string> => {
	return new Promise<string>((resolve, reject) => {
		request(app)
			.post(`/ezelectronics/sessions`)
			.send({ username: "User123", password: "pwd" })
			.expect(200)
			.end((err, res) => {
				if (err) reject(err);
				else resolve(res.header["set-cookie"][0]);
			});
	});
};
