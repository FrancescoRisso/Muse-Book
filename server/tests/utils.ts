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
		db.all(query, params, (err: any, res: any[] | PromiseLike<any[]>) => {
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
		db.run(query, [user, salt, testHash, mail, name, surname, lang], async (err: any) => {
			if (err) return reject(err);
			const id = (await query_db(`SELECT Id FROM ${table} WHERE Username=?`, [user]))[0]["Id"];
			return resolve(id);
		});
	});
};

export const insertBook = async (owner: number, title = "A book", descr = "A test book", permiss = "R", cover = "") => {
	const query = `
	INSERT INTO BOOK(Owner, Title, Description, GeneralPermission, Cover)
	VALUES(?, ?, ?, ?, ?);
	`;

	return new Promise<number>((resolve, reject) => {
		db.run(query, [owner, title, descr, permiss, cover], async (err: any) => {
			if (err) return reject(err);
			const id = (await query_db(`SELECT Id FROM BOOK WHERE Title=? AND Owner=?`, [title, owner]))[0]["Id"];
			return resolve(id);
		});
	});
};

export const insertSong = async (bookId: number, title = "Test song") => {
	const query = `
	INSERT INTO SONG(BookId, Title)
	VALUES(?, ?);
	`;

	return new Promise<number>((resolve, reject) => {
		db.run(query, [bookId, title], async (err: any) => {
			if (err) return reject(err);
			const id = (await query_db(`SELECT Id FROM SONG WHERE Title=? AND BookId=?`, [title, bookId]))[0]["Id"];
			return resolve(id);
		});
	});
};

export const insertUserSearchSong = async (user: number, song: number, date: string): Promise<void> => {
	const query = `
	INSERT INTO USER_SONG_SEARCH(UserId, SongId, Date)
	VALUES(?, ?, ?);
	`;

	return new Promise<void>((resolve, reject) => {
		db.run(query, [user, song, date], (err: any) => (err ? reject(err) : resolve()));
	});
};

export const insertBookInLibrary = async (user: number, book: number, favourite = false) => {
	const query = `
	INSERT INTO USER_HAS_IN_LIBRARY(UserId, BookId, Favorite)
	VALUES(?, ?, ?);
	`;

	return new Promise<void>((resolve, reject) => {
		db.run(query, [user, book, favourite], (err: any) => (err ? reject(err) : resolve()));
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
