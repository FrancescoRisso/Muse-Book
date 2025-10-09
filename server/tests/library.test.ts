import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import { clearDB, insertBook, insertBookInLibrary, insertUser, login, query_db } from "./utils";
import { app } from "../index";
import { BookInLibrary } from "../../types";

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
});
