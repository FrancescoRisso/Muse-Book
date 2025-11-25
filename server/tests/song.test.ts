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

	describe.skip('Delete a song ("DELETE /")', () => {
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

	describe.skip('Create new song ("POST /")', () => {
		test("Song gets created", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);

			const data = { title: "MySong", book, images: [""] };

			const cookie = await login();
			const res = request(app).post(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			const id = (await res).body;

			const query = "SELECT BookId, Title FROM SONG WHERE Id=?";
			const songs = await query_db(query, [id]);
			expect(songs.length).toBe(1);

			const song = songs[0];
			expect(song["BookId"]).toBe(book);
			expect(song["Title"]).toEqual("MySong");
		});

		test("Default song variant gets created", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);

			const data = { title: "MySong", book, images: [""] };

			const cookie = await login();
			const res = request(app).post(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			const song = (await res).body;

			const query = "SELECT Name, Notes FROM SONG_VARIANT WHERE id=?";
			const queryRes = await query_db(query, [song]);
			expect(queryRes.length).toBe(1);

			const insertedVariant = queryRes[0];
			expect(insertedVariant["Name"]).toEqual("Default");
			expect(insertedVariant["Notes"]).toEqual("");
		});

		test("Song images connected (1 page)", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);

			const data = { title: "MySong", book, images: ["img1"] };

			const cookie = await login();
			const res = request(app).post(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			const song = (await res).body;

			const query1 = "SELECT Name, Notes FROM SONG_VARIANT WHERE id=?";
			const variantId = await query_db(query1, [song]);

			const query = "SELECT PageNumber, Annotations, Background FROM SONG_IMAGES WHERE VariantId=?";
			const queryRes = await query_db(query, [variantId]);
			expect(queryRes.length).toBe(1);

			const connectedImg = queryRes[0];
			expect(connectedImg["PageNumber"]).toEqual(0);
			expect(connectedImg["Background"]).toEqual("img1");
			expect(connectedImg["Annotations"]).toEqual("");
		});

		test("Song images connected (2 pages)", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);

			const data = { title: "MySong", book, images: ["img1", "img3"] };

			const cookie = await login();
			const res = request(app).post(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			const song = (await res).body;

			const query1 = "SELECT Name, Notes FROM SONG_VARIANT WHERE id=?";
			const variantId = await query_db(query1, [song]);

			const query = "SELECT PageNumber, Background, Annotations FROM SONG_IMAGES WHERE VariantId=?";
			const queryRes = await query_db(query, [variantId]);
			expect(queryRes.length).toBe(2);

			const connectedImg1 = queryRes[0];
			expect(connectedImg1["PageNumber"]).toEqual(0);
			expect(connectedImg1["Background"]).toEqual("img1");
			expect(connectedImg1["Annotations"]).toEqual("");

			const connectedImg2 = queryRes[1];
			expect(connectedImg2["PageNumber"]).toEqual(1);
			expect(connectedImg2["Background"]).toEqual("img3");
			expect(connectedImg2["Annotations"]).toEqual("");
		});

		test("Non-own book (with edit permissions)", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");

			const book = await insertBook(otherUser, "Book", "", "W");
			await insertBookInLibrary(user, book);
			await insertBookInLibrary(otherUser, book);

			const data = { title: "MySong", book, images: ["img"] };

			const cookie = await login();
			const res = request(app).post(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			const id = (await res).body;

			const query = "SELECT BookId, Title FROM SONG WHERE Id=?";
			const songs = await query_db(query, [id]);
			expect(songs.length).toBe(1);
		});

		test("Non-own book (without edit permissions)", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");

			const book = await insertBook(otherUser, "Book", "", "R");
			await insertBookInLibrary(user, book);
			await insertBookInLibrary(otherUser, book);

			const data = { title: "MySong", book, images: ["img"] };

			const cookie = await login();
			const res = request(app).post(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(403);

			const query = "SELECT BookId, Title FROM SONG";
			const songs = await query_db(query, []);
			expect(songs.length).toBe(0);
		});

		test("Empty title", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);

			const data = { title: "", book, images: ["img"] };

			const cookie = await login();
			const res = request(app).post(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const query = "SELECT BookId, Title FROM SONG";
			const songs = await query_db(query, []);
			expect(songs.length).toBe(0);
		});

		test("Missing title", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);

			const data = { book, images: ["img"] };

			const cookie = await login();
			const res = request(app).post(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const query = "SELECT BookId, Title FROM SONG";
			const songs = await query_db(query, []);
			expect(songs.length).toBe(0);
		});

		test("Missing book", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);

			const data = { title: "MyTitle", images: ["img"] };

			const cookie = await login();
			const res = request(app).post(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const query = "SELECT BookId, Title FROM SONG";
			const songs = await query_db(query, []);
			expect(songs.length).toBe(0);
		});

		test("Missing images", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);

			const data = { title: "MyTitle", book };

			const cookie = await login();
			const res = request(app).post(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const query = "SELECT BookId, Title FROM SONG";
			const songs = await query_db(query, []);
			expect(songs.length).toBe(0);
		});

		test("Empty images", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);

			const data = { title: "MyTitle", book, images: [] as string[] };

			const cookie = await login();
			const res = request(app).post(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const query = "SELECT BookId, Title FROM SONG";
			const songs = await query_db(query, []);
			expect(songs.length).toBe(0);
		});

		test("User not logged in", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);

			const data = { title: "MyTitle", book, images: ["img"] };

			const res = request(app).post(`${baseUrl}`).send(data);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);

			const query = "SELECT BookId, Title FROM SONG";
			const songs = await query_db(query, []);
			expect(songs.length).toBe(0);
		});

		test("Title already taken", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);

			await insertSong(book, "MyTitle");

			const data = { title: "MyTitle", book, images: ["img"] };

			const cookie = await login();
			const res = request(app).post(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(409);

			const query = "SELECT BookId, Title FROM SONG";
			const songs = await query_db(query, []);
			expect(songs.length).toBe(0);
		});

		test("Title taken in another book", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			const otherBook = await insertBook(user, "OtherBook");
			await insertBookInLibrary(user, book);

			await insertSong(otherBook, "MyTitle");

			const data = { title: "MyTitle", book, images: ["img"] };

			const cookie = await login();
			const res = request(app).post(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			const id = (await res).body;

			const query = "SELECT BookId, Title FROM SONG WHERE Id=?";
			const songs = await query_db(query, [id]);
			expect(songs.length).toBe(1);
		});

		test("Non existing book", async () => {
			const user = await insertUser();

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);

			const data = { title: "MyTitle", book: book + 1, images: ["img"] };

			const cookie = await login();
			const res = request(app).post(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(404);

			const query = "SELECT BookId, Title FROM SONG";
			const songs = await query_db(query, []);
			expect(songs.length).toBe(0);
		});

		test("Update tables", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");

			const book = await insertBook(user);
			await insertBookInLibrary(user, book);
			await insertBookInLibrary(otherUser, book);

			const cookie = await login();
			const otherSession = await login();
			const otherUserSession = await login("OtherUser");

			const data = { title: "MyTitle", book, images: ["img"] };
			const res = request(app).post(`${baseUrl}`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			expect(await new UpdatesBookInfo(otherSession, book).hasUpdate()).toBeTruthy();
			expect(await new UpdatesBookInfo(otherUserSession, book).hasUpdate()).toBeTruthy();
		});
	});
});
