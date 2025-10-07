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

export const insertUser = async (
	user = "User123",
	pwd = "pwd",
	salt = 123456789,
	mail = "user@name.com",
	name = "Mario",
	surname = "Rossi",
	lang = "IT",
	confirmed = true,
) => {
	const testHash = createHash("sha256").update(`${pwd}${salt}`).digest("hex");
	const table = confirmed ? "USER" : "UNCONFIRMED_USER";

	const query = `
	INSERT INTO ${table}(Username, Salt, Hash, Email, Name, Surname, Language)
	VALUES(?, ?, ?, ?, ?, ?, ?);
	`;

	return new Promise<number>((resolve, reject) => {
		db.run(query, [user, salt, testHash, mail, name, surname, lang], async (err) => {
			if (err) return reject(err);
			const id = (await query_db(`SELECT Id FROM ${table} WHERE Username=?`, [user]))[0]["Id"];
			return resolve(id);
		});
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
