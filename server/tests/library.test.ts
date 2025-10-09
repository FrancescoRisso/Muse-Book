import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import {
	addCustomBookPermission,
	clearDB,
	insertBook,
	insertBookInLibrary,
	insertUser,
	login,
	query_db,
} from "./utils";
import { app } from "../index";
import { BookInLibrary } from "../../types";
import { UpdatesLibrary } from "./update_tables_utils";

beforeEach(clearDB);

const baseUrl = "/musebook/api/library";

describe(`Library APIs ("${baseUrl}")`, () => {
	describe.skip('Get books in library ("GET /")', () => {
		test("Empty library", async () => {
			await insertUser();

			const cookie = await login();
			const res = request(app).get(baseUrl).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual([]);
		});

		test("Own book - non favourite", async () => {
			const user = await insertUser();
			const book = await insertBook(user);
			await insertBookInLibrary(user, book);

			const cookie = await login();
			const res = request(app).get(baseUrl).set("Cookie", cookie);

			const res_expected: BookInLibrary[] = [{ id: book, isFavourite: false, isOwner: true }];

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("Own book - favourite", async () => {
			const user = await insertUser();
			const book = await insertBook(user);
			await insertBookInLibrary(user, book, true);

			const cookie = await login();
			const res = request(app).get(baseUrl).set("Cookie", cookie);

			const res_expected: BookInLibrary[] = [{ id: book, isFavourite: true, isOwner: true }];

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("Other book - non favourite", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser);
			await insertBookInLibrary(user, book);

			const cookie = await login();
			const res = request(app).get(baseUrl).set("Cookie", cookie);

			const res_expected: BookInLibrary[] = [{ id: book, isFavourite: false, isOwner: false }];

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("Other book - favourite", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser);
			await insertBookInLibrary(user, book, true);

			const cookie = await login();
			const res = request(app).get(baseUrl).set("Cookie", cookie);

			const res_expected: BookInLibrary[] = [{ id: book, isFavourite: true, isOwner: false }];

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("Multiple books", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book1 = await insertBook(user);
			const book2 = await insertBook(otherUser);
			await insertBookInLibrary(user, book1, true);
			await insertBookInLibrary(user, book2);

			const cookie = await login();
			const res = request(app).get(baseUrl).set("Cookie", cookie);

			const res_expected: BookInLibrary[] = [
				{ id: book1, isFavourite: true, isOwner: true },
				{ id: book2, isFavourite: false, isOwner: false },
			];

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toEqual(res_expected);
		});

		test("Not logged in", async () => {
			const res = request(app).get(baseUrl);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);
		});
	});

	describe('Add public book to library ("POST /")', () => {
		test("Success (book is publicly readable)", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser);

			const cookie = await login();
			const res = request(app).post(baseUrl).send({ book }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const query = "SELECT COUNT(*) FROM USER_HAS_IN_LIBRARY WHERE UserId=?";
			const booksInLibrary = (await query_db(query, [user]))[0]["COUNT(*)"];
			expect(booksInLibrary).toBe(1);

			expect(await new UpdatesLibrary(cookie).hasUpdate()).toBeTruthy();
		});
		test("Success (book is publicly writable)", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser, "Book", "Everyone can edit", "W");

			const cookie = await login();
			const res = request(app).post(baseUrl).send({ book }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const query = "SELECT COUNT(*) FROM USER_HAS_IN_LIBRARY WHERE UserId=?";
			const booksInLibrary = (await query_db(query, [user]))[0]["COUNT(*)"];
			expect(booksInLibrary).toBe(1);

			expect(await new UpdatesLibrary(cookie).hasUpdate()).toBeTruthy();
		});

		test("Success (another book already in library)", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book1 = await insertBook(otherUser);
			const book2 = await insertBook(user);
			await insertBookInLibrary(user, book2, true);

			const cookie = await login();
			const res = request(app).post(baseUrl).send({ book1 }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const query = "SELECT COUNT(*) FROM USER_HAS_IN_LIBRARY WHERE UserId=?";
			const booksInLibrary = (await query_db(query, [user]))[0]["COUNT(*)"];
			expect(booksInLibrary).toBe(2);

			expect(await new UpdatesLibrary(cookie).hasUpdate()).toBeTruthy();
		});

		test("Book already in library (do nothing)", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser);
			await insertBookInLibrary(user, book, true);

			const cookie = await login();
			const res = request(app).post(baseUrl).send({ book }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const query = "SELECT COUNT(*) FROM USER_HAS_IN_LIBRARY WHERE UserId=?";
			const booksInLibrary = (await query_db(query, [user]))[0]["COUNT(*)"];
			expect(booksInLibrary).toBe(1);

			expect(await new UpdatesLibrary(cookie).hasUpdate()).toBeFalsy();
		});

		test("Own book (do nothing)", async () => {
			const user = await insertUser();
			const book = await insertBook(user);
			await insertBookInLibrary(user, book, true);

			const cookie = await login();
			const res = request(app).post(baseUrl).send({ book }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const query = "SELECT COUNT(*) FROM USER_HAS_IN_LIBRARY WHERE UserId=?";
			const booksInLibrary = (await query_db(query, [user]))[0]["COUNT(*)"];
			expect(booksInLibrary).toBe(1);

			expect(await new UpdatesLibrary(cookie).hasUpdate()).toBeFalsy();
		});

		test("Not logged in", async () => {
			const user = await insertUser();
			const book = await insertBook(user);

			const res = request(app).post(baseUrl).send({ book });

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);

			const query = "SELECT COUNT(*) FROM USER_HAS_IN_LIBRARY WHERE UserId=?";
			const booksInLibrary = (await query_db(query, [user]))[0]["COUNT(*)"];
			expect(booksInLibrary).toBe(0);
		});

		test("Book not a number", async () => {
			const user = await insertUser();

			const cookie = await login();
			const res = request(app).post(baseUrl).send({ book: "book" }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const query = "SELECT COUNT(*) FROM USER_HAS_IN_LIBRARY WHERE UserId=?";
			const booksInLibrary = (await query_db(query, [user]))[0]["COUNT(*)"];
			expect(booksInLibrary).toBe(0);

			expect(await new UpdatesLibrary(cookie).hasUpdate()).toBeFalsy();
		});

		test("Book does not exist", async () => {
			const user = await insertUser();

			const cookie = await login();
			const res = request(app).post(baseUrl).send({ book: 0 }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(404);

			const query = "SELECT COUNT(*) FROM USER_HAS_IN_LIBRARY WHERE UserId=?";
			const booksInLibrary = (await query_db(query, [user]))[0]["COUNT(*)"];
			expect(booksInLibrary).toBe(0);

			expect(await new UpdatesLibrary(cookie).hasUpdate()).toBeFalsy();
		});

		test("Book is not publicly accessible", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser, "Book", "Private book", "-", "");

			const cookie = await login();
			const res = request(app).post(baseUrl).send({ book }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);

			const query = "SELECT COUNT(*) FROM USER_HAS_IN_LIBRARY WHERE UserId=?";
			const booksInLibrary = (await query_db(query, [user]))[0]["COUNT(*)"];
			expect(booksInLibrary).toBe(0);

			expect(await new UpdatesLibrary(cookie).hasUpdate()).toBeFalsy();
		});

		test("Book is not publicly accessible, but user has custom permissions to read it", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser, "Book", "Private book", "-", "");
			await addCustomBookPermission(user, book, "R");

			const cookie = await login();
			const res = request(app).post(baseUrl).send({ book }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const query = "SELECT COUNT(*) FROM USER_HAS_IN_LIBRARY WHERE UserId=?";
			const booksInLibrary = (await query_db(query, [user]))[0]["COUNT(*)"];
			expect(booksInLibrary).toBe(1);

			expect(await new UpdatesLibrary(cookie).hasUpdate()).toBeTruthy();
		});

		test("Book is not publicly accessible, but user has custom permissions to write it", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser, "Book", "Private book", "-", "");
			await addCustomBookPermission(user, book, "W");

			const cookie = await login();
			const res = request(app).post(baseUrl).send({ book }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const query = "SELECT COUNT(*) FROM USER_HAS_IN_LIBRARY WHERE UserId=?";
			const booksInLibrary = (await query_db(query, [user]))[0]["COUNT(*)"];
			expect(booksInLibrary).toBe(1);

			expect(await new UpdatesLibrary(cookie).hasUpdate()).toBeTruthy();
		});

		test("Book is publicly accessible, but user is banned from it", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser);
			await addCustomBookPermission(user, book, "-");

			const cookie = await login();
			const res = request(app).post(baseUrl).send({ book }).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);

			const query = "SELECT COUNT(*) FROM USER_HAS_IN_LIBRARY WHERE UserId=?";
			const booksInLibrary = (await query_db(query, [user]))[0]["COUNT(*)"];
			expect(booksInLibrary).toBe(0);

			expect(await new UpdatesLibrary(cookie).hasUpdate()).toBeFalsy();
		});
	});
});
