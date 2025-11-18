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
} from "./utils";
import { app } from "../index";

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
});
