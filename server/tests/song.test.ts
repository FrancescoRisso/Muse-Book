import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import {
	addCustomBookPermission,
	clearDB,
	insertBook,
	insertBookInLibrary,
	insertSong,
	insertSongVariant,
	insertUser,
	login,
	query_db,
} from "./utils";
import { app } from "../index";
import { UpdatesBookInfo, UpdatesSong } from "./update_tables_utils";

beforeEach(clearDB);

const baseUrl = "/musebook/api/song";

describe(`Song APIs ("${baseUrl}")`, () => {
	describe.skip('Get data of a song ("GET /:id")', () => {
		test("Own book", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);
			const song = await insertSong(book, "Song");

			const v1 = await insertSongVariant(song);
			const v2 = await insertSongVariant(song, "Capo I", "Nicer to play");

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/${song}`).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			expect((await res).body).toHaveProperty("title", "Song");
			expect((await res).body).toHaveProperty("variants");
			expect((await res).body.variants).toContain(v1);
			expect((await res).body.variants).toContain(v2);
		});

		test("Accessible, non-own book", async () => {
			const user = await insertUser();
			const otherUser = await insertUser();

			const book = await insertBook(otherUser);
			await addCustomBookPermission(user, book, "W");
			await insertBookInLibrary(user, book);

			const song = await insertSong(book, "Song");
			const v1 = await insertSongVariant(song);
			const v2 = await insertSongVariant(song, "Capo I", "Nicer to play");

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/${song}`).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			expect((await res).body).toHaveProperty("title", "Song");
			expect((await res).body).toHaveProperty("variants");
			expect((await res).body.variants).toContain(v1);
			expect((await res).body.variants).toContain(v2);
		});

		test("Id not a number", async () => {
			await insertUser();

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/song`).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);
		});

		test("User not logged in", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);
			const song = await insertSong(book, "Song");

			const res = request(app).get(`${baseUrl}/${song}`);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);
		});

		test("Song does not exist", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);
			const song = await insertSong(book, "Song");

			const res = request(app).get(`${baseUrl}/${song + 1}`);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);
		});

		test("Book not accessible", async () => {
			const user = await insertUser();
			const otherUser = await insertUser();

			const book = await insertBook(otherUser);
			await addCustomBookPermission(user, book, "-");
			await insertBookInLibrary(otherUser, book);

			const song = await insertSong(book, "Song");
			const v1 = await insertSongVariant(song);
			const v2 = await insertSongVariant(song, "Capo I", "Nicer to play");

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/${song}`).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(403);

			expect((await res).body).toHaveProperty("title", "Song");
			expect((await res).body).toHaveProperty("variants");
			expect((await res).body.variants).toContain(v1);
			expect((await res).body.variants).toContain(v2);
		});
	});

	describe.skip('Change title of a song ("PATCH /")', () => {
		test("Own book", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);
			const song = await insertSong(book, "Song");

			const cookie = await login();
			const data = { id: song, title: "New song title" };
			const res = request(app).patch(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const query = "SELECT Title FROM SONG WHERE Id=?";
			const newTitle = (await query_db(query, [song]))[0]["Title"];
			expect(newTitle).toBe("New song title");
		});

		test("Non-own, editable book", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");

			const book = await insertBook(otherUser, "Book", "", "W");
			await insertBookInLibrary(user, book);
			const song = await insertSong(book, "Song");

			const cookie = await login();
			const data = { id: song, title: "New song title" };
			const res = request(app).patch(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const query = "SELECT Title FROM SONG WHERE Id=?";
			const newTitle = (await query_db(query, [song]))[0]["Title"];
			expect(newTitle).toBe("New song title");
		});

		test("Emtpy title", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");

			const book = await insertBook(otherUser, "Book", "", "W");
			await insertBookInLibrary(user, book);
			const song = await insertSong(book, "Song");

			const cookie = await login();
			const data = { id: song, title: "" };
			const res = request(app).patch(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const query = "SELECT Title FROM SONG WHERE Id=?";
			const newTitle = (await query_db(query, [song]))[0]["Title"];
			expect(newTitle).toBe("Song");
		});

		test("Non-number id", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");

			const book = await insertBook(otherUser, "Book", "", "W");
			await insertBookInLibrary(user, book);
			const song = await insertSong(book, "Song");

			const cookie = await login();
			const data = { id: "song", title: "New song title" };
			const res = request(app).patch(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const query = "SELECT Title FROM SONG WHERE Id=?";
			const newTitle = (await query_db(query, [song]))[0]["Title"];
			expect(newTitle).toBe("Song");
		});

		test("Song does not exist", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");

			const book = await insertBook(otherUser, "Book", "", "W");
			await insertBookInLibrary(user, book);
			const song = await insertSong(book, "Song");

			const cookie = await login();
			const data = { id: song + 1, title: "New song title" };
			const res = request(app).patch(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(403);

			const query = "SELECT Title FROM SONG WHERE Id=?";
			const newTitle = (await query_db(query, [song]))[0]["Title"];
			expect(newTitle).toBe("Song");
		});

		test("Non-own, non-editable book", async () => {
			await insertUser();
			const otherUser = await insertUser("OtherUser");

			const book = await insertBook(otherUser, "Book", "", "-");
			const song = await insertSong(book, "Song");

			const cookie = await login();
			const data = { id: song, title: "New song title" };
			const res = request(app).patch(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(403);

			const query = "SELECT Title FROM SONG WHERE Id=?";
			const newTitle = (await query_db(query, [song]))[0]["Title"];
			expect(newTitle).toBe("Song");
		});

		test("Udpates tables", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);
			await insertBookInLibrary(otherUser, book);
			const song = await insertSong(book, "Song");

			const data = { id: song, title: "New song title" };

			const cookie = await login();
			const otherSession = await login();
			const otherUserSession = await login("OtherUser");
			const res = request(app).patch(`${baseUrl}/`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			expect(await new UpdatesSong(otherUserSession, song).hasUpdate()).toBeTruthy();
			expect(await new UpdatesSong(otherSession, song).hasUpdate()).toBeTruthy();
		});

		test("User is not logged in", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			const song = await insertSong(book, "Song");

			const data = { id: song, title: "New song title" };
			const res = request(app).patch(`${baseUrl}`).send(data);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);

			const query = "SELECT Title FROM SONG WHERE Id=?";
			const newTitle = (await query_db(query, [song]))[0]["Title"];
			expect(newTitle).toBe("Song");
		});
	});

	describe('Delete a song ("DELETE /")', () => {
		test("Own book", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);
			const song = await insertSong(book, "Song");

			const cookie = await login();
			const res = request(app).delete(`${baseUrl}`).send({ id: song }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const query = "SELECT COUNT(*) FROM SONG";
			const num = (await query_db(query, []))[0]["COUNT(*)"];
			expect(num).toBe(0);
		});

		test("Non-own book, with writing permission", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");

			const book = await insertBook(otherUser, "", "", "W");
			await insertBookInLibrary(user, book);
			const song = await insertSong(book, "Song");

			const cookie = await login();
			const res = request(app).delete(`${baseUrl}`).send({ id: song }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const query = "SELECT COUNT(*) FROM SONG";
			const num = (await query_db(query, []))[0]["COUNT(*)"];
			expect(num).toBe(0);
		});

		test("Non-own book, without writing permission", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");

			const book = await insertBook(otherUser, "", "", "R");
			await insertBookInLibrary(user, book);
			const song = await insertSong(book, "Song");

			const cookie = await login();
			const res = request(app).delete(`${baseUrl}`).send({ id: song }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(403);

			const query = "SELECT COUNT(*) FROM SONG";
			const num = (await query_db(query, []))[0]["COUNT(*)"];
			expect(num).toBe(1);
		});

		test("Id NaN", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);
			await insertSong(book, "Song");

			const cookie = await login();
			const res = request(app).delete(`${baseUrl}`).send({ id: "song" }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const query = "SELECT COUNT(*) FROM SONG";
			const num = (await query_db(query, []))[0]["COUNT(*)"];
			expect(num).toBe(1);
		});

		test("Id does not exist", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);
			const song = (await insertSong(book, "Song")) + 1;

			const cookie = await login();
			const res = request(app).delete(`${baseUrl}`).send({ id: song }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(404);

			const query = "SELECT COUNT(*) FROM SONG";
			const num = (await query_db(query, []))[0]["COUNT(*)"];
			expect(num).toBe(1);
		});

		test("User not logged in", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);
			const song = await insertSong(book, "Song");

			const res = request(app).delete(`${baseUrl}`).send({ id: song });

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);

			const query = "SELECT COUNT(*) FROM SONG";
			const num = (await query_db(query, []))[0]["COUNT(*)"];
			expect(num).toBe(1);
		});

		test("Update tables", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);
			await insertBookInLibrary(otherUser, book);
			const song = await insertSong(book, "Song");

			const cookie = await login();
			const otherSession = await login();
			const otherUserSession = await login("OtherUser");
			const res = request(app).delete(`${baseUrl}`).send({ id: song }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			expect(await new UpdatesBookInfo(otherSession, book).hasUpdate()).toBeTruthy();
			expect(await new UpdatesBookInfo(otherUserSession, book).hasUpdate()).toBeTruthy();
		});
	});
});
