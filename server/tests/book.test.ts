import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import {
	addCustomBookPermission,
	clearDB,
	insertBook,
	insertBookInLibrary,
	insertSong,
	insertUser,
	login,
	query_db,
} from "./utils";
import { app } from "../index";
import { UpdatesLibrary } from "./update_tables_utils";

beforeEach(clearDB);

const baseUrl = "/musebook/api/book";

describe(`Book APIs ("${baseUrl}")`, () => {
	describe.skip('Get basic data of all accessible books ("GET /list")', () => {
		test("No accessible book", async () => {
			await insertUser();
			const otherUser = await insertUser("OtherUser");
			await insertBook(otherUser, "Book", "Private book", "-");

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/list`).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual([]);
		});

		test("Public book (not in library, publicly readable)", async () => {
			await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser, "Book");
			const song1 = await insertSong(book, "Song1");
			const song2 = await insertSong(book, "Song2");

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/list`).set("Cookie", cookie);

			const res_expected = [
				{
					owner: otherUser,
					ownerName: "OtherUser",
					title: "Book",
					songs: [
						{ id: song1, title: "Song1" },
						{ id: song2, title: "Song2" },
					],
				},
			];

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("Public book (in library, publicly readable)", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser, "Book");
			const song1 = await insertSong(book, "Song1");
			const song2 = await insertSong(book, "Song2");
			await insertBookInLibrary(user, book);

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/list`).set("Cookie", cookie);

			const res_expected = [
				{
					owner: otherUser,
					ownerName: "OtherUser",
					title: "Book",
					songs: [
						{ id: song1, title: "Song1" },
						{ id: song2, title: "Song2" },
					],
				},
			];

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("Public book (not in library, publicly writable)", async () => {
			await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser, "Book", "Writable book", "W");
			const song1 = await insertSong(book, "Song1");
			const song2 = await insertSong(book, "Song2");

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/list`).set("Cookie", cookie);

			const res_expected = [
				{
					owner: otherUser,
					ownerName: "OtherUser",
					title: "Book",
					songs: [
						{ id: song1, title: "Song1" },
						{ id: song2, title: "Song2" },
					],
				},
			];

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("Public book (in library, publicly writable)", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser, "Book", "Writable book", "W");
			const song1 = await insertSong(book, "Song1");
			const song2 = await insertSong(book, "Song2");
			await insertBookInLibrary(user, book);

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/list`).set("Cookie", cookie);

			const res_expected = [
				{
					owner: otherUser,
					ownerName: "OtherUser",
					title: "Book",
					songs: [
						{ id: song1, title: "Song1" },
						{ id: song2, title: "Song2" },
					],
				},
			];

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("Own book", async () => {
			const user = await insertUser();
			const book = await insertBook(user, "Book");
			const song1 = await insertSong(book, "Song1");
			const song2 = await insertSong(book, "Song2");
			await insertBookInLibrary(user, book);

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/list`).set("Cookie", cookie);

			const res_expected = [
				{
					owner: user,
					ownerName: "User123",
					title: "Book",
					songs: [
						{ id: song1, title: "Song1" },
						{ id: song2, title: "Song2" },
					],
				},
			];

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("Private, not-owned book, with custom read permission (not in library)", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser, "Book", "Private book", "-");
			const song1 = await insertSong(book, "Song1");
			const song2 = await insertSong(book, "Song2");
			await addCustomBookPermission(user, book, "R");

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/list`).set("Cookie", cookie);

			const res_expected = [
				{
					owner: otherUser,
					ownerName: "OtherUser",
					title: "Book",
					songs: [
						{ id: song1, title: "Song1" },
						{ id: song2, title: "Song2" },
					],
				},
			];

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("Private, not-owned book, with custom read permission (in library)", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser, "Book", "Private book", "-");
			const song1 = await insertSong(book, "Song1");
			const song2 = await insertSong(book, "Song2");
			await addCustomBookPermission(user, book, "R");
			await insertBookInLibrary(user, book);

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/list`).set("Cookie", cookie);

			const res_expected = [
				{
					owner: otherUser,
					ownerName: "OtherUser",
					title: "Book",
					songs: [
						{ id: song1, title: "Song1" },
						{ id: song2, title: "Song2" },
					],
				},
			];

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("Private, not-owned book, with custom write permission (not in library)", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser, "Book", "Private book", "-");
			const song1 = await insertSong(book, "Song1");
			const song2 = await insertSong(book, "Song2");
			await addCustomBookPermission(user, book, "W");

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/list`).set("Cookie", cookie);

			const res_expected = [
				{
					owner: otherUser,
					ownerName: "OtherUser",
					title: "Book",
					songs: [
						{ id: song1, title: "Song1" },
						{ id: song2, title: "Song2" },
					],
				},
			];

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("Private, not-owned book, with custom write permission (in library)", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser, "Book", "Private book", "-");
			const song1 = await insertSong(book, "Song1");
			const song2 = await insertSong(book, "Song2");
			await addCustomBookPermission(user, book, "W");
			await insertBookInLibrary(user, book);

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/list`).set("Cookie", cookie);

			const res_expected = [
				{
					owner: otherUser,
					ownerName: "OtherUser",
					title: "Book",
					songs: [
						{ id: song1, title: "Song1" },
						{ id: song2, title: "Song2" },
					],
				},
			];

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("Multiple books", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");

			const bookOwn = await insertBook(user, "BookOwn");
			const songOwn1 = await insertSong(bookOwn, "SongOwn1");
			const songOwn2 = await insertSong(bookOwn, "SongOwn2");

			const bookRead = await insertBook(otherUser, "BookRead", "", "R");
			const songRead = await insertSong(bookRead, "SongRead");

			const bookReadLib = await insertBook(otherUser, "BookReadLib", "", "R");
			const songReadLib = await insertSong(bookReadLib, "SongReadLib");
			await insertBookInLibrary(user, bookReadLib);

			const bookWrite = await insertBook(otherUser, "BookWrite", "", "W");
			const songWrite = await insertSong(bookWrite, "SongWrite");

			const bookWriteLib = await insertBook(otherUser, "BookWriteLib", "", "W");
			const songWriteLib = await insertSong(bookWriteLib, "SongWriteLib");
			await insertBookInLibrary(user, bookWriteLib);

			const bookCustomRead = await insertBook(otherUser, "BookCustomRead", "", "-");
			const songCustomRead = await insertSong(bookCustomRead, "SongCustomRead");
			await addCustomBookPermission(user, bookCustomRead, "R");

			const bookCustomReadLib = await insertBook(otherUser, "BookCustomReadLib", "", "-");
			const songCustomReadLib = await insertSong(bookCustomReadLib, "SongCustomReadLib");
			await insertBookInLibrary(user, bookCustomReadLib);
			await addCustomBookPermission(user, bookCustomReadLib, "R");

			const bookCustomWrite = await insertBook(otherUser, "BookCustomWrite", "", "-");
			const songCustomWrite = await insertSong(bookCustomWrite, "SongCustomWrite");
			await addCustomBookPermission(user, bookCustomWrite, "W");

			const bookCustomWriteLib = await insertBook(otherUser, "BookCustomWriteLib", "", "-");
			const songCustomWriteLib = await insertSong(bookCustomWriteLib, "SongCustomWriteLib");
			await insertBookInLibrary(user, bookCustomWriteLib);
			await addCustomBookPermission(user, bookCustomWriteLib, "W");

			const bookNoAccess = await insertBook(otherUser, "BookNoAccess", "", "-");
			await insertSong(bookNoAccess, "SongNoAccess");
			await insertBookInLibrary(user, bookNoAccess);

			const bookBanned = await insertBook(otherUser, "BookBanned", "", "R");
			await insertSong(bookBanned, "SongBanned");
			await addCustomBookPermission(user, bookBanned, "-");

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/list`).set("Cookie", cookie);

			const res_expected = [
				{
					owner: user,
					ownerName: "User123",
					title: "BookOwn",
					songs: [
						{ id: songOwn1, title: "SongOwn1" },
						{ id: songOwn2, title: "SongOwn2" },
					],
				},
				{
					owner: otherUser,
					ownerName: "OtherUser",
					title: "BookRead",
					songs: [{ id: songRead, title: "SongRead" }],
				},
				{
					owner: otherUser,
					ownerName: "OtherUser",
					title: "BookReadLib",
					songs: [{ id: songReadLib, title: "SongReadLib" }],
				},
				{
					owner: otherUser,
					ownerName: "OtherUser",
					title: "BookWrite",
					songs: [{ id: songWrite, title: "SongWrite" }],
				},
				{
					owner: otherUser,
					ownerName: "OtherUser",
					title: "BookWriteLib",
					songs: [{ id: songWriteLib, title: "SongWriteLib" }],
				},
				{
					owner: otherUser,
					ownerName: "OtherUser",
					title: "BookCustomRead",
					songs: [{ id: songCustomRead, title: "SongCustomRead" }],
				},
				{
					owner: otherUser,
					ownerName: "OtherUser",
					title: "BookCustomReadLib",
					songs: [{ id: songCustomReadLib, title: "SongCustomReadLib" }],
				},
				{
					owner: otherUser,
					ownerName: "OtherUser",
					title: "BookCustomWrite",
					songs: [{ id: songCustomWrite, title: "SongCustomWrite" }],
				},
				{
					owner: otherUser,
					ownerName: "OtherUser",
					title: "BookCustomWriteLib",
					songs: [{ id: songCustomWriteLib, title: "SongCustomWriteLib" }],
				},
			];

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("User not logged in", async () => {
			await insertUser();

			const res = request(app).get(`${baseUrl}/list`);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);
		});
	});

	describe.skip('Get all data about a specific book ("GET /:id")', () => {
		test("Own book", async () => {
			const user = await insertUser();
			const book = await insertBook(user, "Book", "Book description", "-", "<svg></svg>");
			const song1 = await insertSong(book, "Song1");
			const song2 = await insertSong(book, "Song2");

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/${book}`).set("Cookie", cookie);

			const res_expected = {
				owner: user,
				ownerName: "User123",
				canEdit: true,
				title: "Book",
				description: "Book description",
				cover: "<svg></svg>",
				songs: [song1, song2],
			};

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("Public book (with write access)", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser, "Book", "Book description", "W", "<svg></svg>");
			const song1 = await insertSong(book, "Song1");
			const song2 = await insertSong(book, "Song2");

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/${book}`).set("Cookie", cookie);

			const res_expected = {
				owner: otherUser,
				ownerName: "OtherUser",
				canEdit: true,
				title: "Book",
				description: "Book description",
				cover: "<svg></svg>",
				songs: [song1, song2],
			};

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("Public book (with read access)", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser, "Book", "Book description", "R", "<svg></svg>");
			const song1 = await insertSong(book, "Song1");
			const song2 = await insertSong(book, "Song2");

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/${book}`).set("Cookie", cookie);

			const res_expected = {
				owner: otherUser,
				ownerName: "OtherUser",
				canEdit: false,
				title: "Book",
				description: "Book description",
				cover: "<svg></svg>",
				songs: [song1, song2],
			};

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("Private book (with personal write access)", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser, "Book", "Book description", "-", "<svg></svg>");
			addCustomBookPermission(user, book, "W");
			const song1 = await insertSong(book, "Song1");
			const song2 = await insertSong(book, "Song2");

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/${book}`).set("Cookie", cookie);

			const res_expected = {
				owner: otherUser,
				ownerName: "OtherUser",
				canEdit: true,
				title: "Book",
				description: "Book description",
				cover: "<svg></svg>",
				songs: [song1, song2],
			};

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("Private book (with personal read access)", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser, "Book", "Book description", "-", "<svg></svg>");
			addCustomBookPermission(user, book, "R");
			const song1 = await insertSong(book, "Song1");
			const song2 = await insertSong(book, "Song2");

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/${book}`).set("Cookie", cookie);

			const res_expected = {
				owner: otherUser,
				ownerName: "OtherUser",
				canEdit: false,
				title: "Book",
				description: "Book description",
				cover: "<svg></svg>",
				songs: [song1, song2],
			};

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("Unaccessible book", async () => {
			await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser, "Book", "Book description", "-", "<svg></svg>");
			await insertSong(book, "Song1");
			await insertSong(book, "Song2");

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/${book}`).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(403);
		});

		test("Non existing book", async () => {
			await insertUser();
			const cookie = await login();
			const res = request(app).get(`${baseUrl}/1`).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(403);
		});

		test("Id is not a number", async () => {
			await insertUser();

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/book`).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(403);
		});

		test("User not logged in", async () => {
			const user = await insertUser();
			const book = await insertBook(user);
			insertBookInLibrary(user, book);

			const res = request(app).get(`${baseUrl}/${book}`);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);
		});
	});

	describe.skip('Toggle favorite flag from book ("POST /favorite")', () => {
		test("Add favorite", async () => {
			const user = await insertUser();
			const book = await insertBook(user);
			await insertBookInLibrary(user, book, false);

			const cookie = await login();
			const otherSession = await login();
			const res = request(app).post(`${baseUrl}/favorite`).send({ id: book }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const query = "SELECT Favorite FROM USER_HAS_IN_LIBRARY WHERE UserId=? AND BookId=?";
			const isFavorite = (await query_db(query, [user, book]))[0]["Favorite"];
			expect(isFavorite).toBeTruthy();
			expect(await new UpdatesLibrary(otherSession).hasUpdate()).toBeTruthy();
		});

		test("Remove favorite", async () => {
			const user = await insertUser();
			const book = await insertBook(user);
			await insertBookInLibrary(user, book, true);

			const cookie = await login();
			const res = request(app).post(`${baseUrl}/favorite`).send({ id: book }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const query = "SELECT Favorite FROM USER_HAS_IN_LIBRARY WHERE UserId=? AND BookId=?";
			const isFavorite = (await query_db(query, [user, book]))[0]["Favorite"];
			expect(isFavorite).toBeFalsy();
			expect(await new UpdatesLibrary(cookie).hasUpdate()).toBeTruthy();
		});

		test("Id not a number", async () => {
			const user = await insertUser();
			const book = await insertBook(user);
			await insertBookInLibrary(user, book, false);

			const cookie = await login();
			const otherSession = await login();
			const res = request(app).post(`${baseUrl}/favorite`).send({ id: "id" }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			expect(await new UpdatesLibrary(otherSession).hasUpdate()).toBeFalsy();
		});

		test("Book does not exist", async () => {
			await insertUser();

			const cookie = await login();
			const otherSession = await login();
			const res = request(app).post(`${baseUrl}/favorite`).send({ id: 1 }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(404);

			expect(await new UpdatesLibrary(otherSession).hasUpdate()).toBeFalsy();
		});

		test("Book not in library", async () => {
			await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser);

			const cookie = await login();
			const otherSession = await login();
			const res = request(app).post(`${baseUrl}/favorite`).send({ id: book }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(404);

			expect(await new UpdatesLibrary(otherSession).hasUpdate()).toBeFalsy();
		});

		test("User not logged in", async () => {
			const user = await insertUser();
			const book = await insertBook(user);
			await insertBookInLibrary(user, book, false);

			const res = request(app).post(`${baseUrl}/favorite`).send({ id: book });

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);
		});
	});
});
