import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import { clearDB, insertBook, insertSong, insertUser, insertUserSearchSong, login, query_db } from "./utils";
import { app } from "../index";

beforeEach(clearDB);

const baseUrl = "/musebook/api/user";

describe(`User APIs ("${baseUrl}")`, () => {
	describe.skip('Confirm unregistered user ("POST -confirm/:id/:salt")', () => {
		test("Successful confirmation", async () => {
			const id = await insertUser("User456", "pwd", 111111111, "user@name.com", "Mario", "Rossi", "IT", false);
			const res = request(app).post(`${baseUrl}-confirm/${id}/111111111`);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const logged_devices = (await query_db("SELECT COUNT(*) FROM LOGGED_IN_DEVICES", []))[0]["COUNT(*)"];
			expect(logged_devices).toBe(1);

			const users = (await query_db("SELECT COUNT(*) FROM USER", []))[0]["COUNT(*)"];
			expect(users).toBe(1);
		});

		test("Id is not an unconfirmed user", async () => {
			const res = request(app).post(`${baseUrl}-confirm/1/111111111`);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(404);

			const users = (await query_db("SELECT COUNT(*) FROM USER", []))[0]["COUNT(*)"];
			expect(users).toBe(0);
		});

		test("Wrong salt", async () => {
			const id = await insertUser("User456", "pwd", 111111111, "user@name.com", "Mario", "Rossi", "IT", false);
			const res = request(app).post(`${baseUrl}-confirm/${id}/123`);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(409);

			const users = (await query_db("SELECT COUNT(*) FROM USER", []))[0]["COUNT(*)"];
			expect(users).toBe(0);
		});

		test("Id is not a number", async () => {
			await insertUser("User456", "pwd", 111111111, "user@name.com", "Mario", "Rossi", "IT", false);
			const res = request(app).post(`${baseUrl}-confirm/hello/111111111`);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const users = (await query_db("SELECT COUNT(*) FROM USER", []))[0]["COUNT(*)"];
			expect(users).toBe(0);
		});

		test("Salt is not a number", async () => {
			const id = await insertUser("User456", "pwd", 111111111, "user@name.com", "Mario", "Rossi", "IT", false);
			const res = request(app).post(`${baseUrl}-user-confirm/${id}/hello`);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const users = (await query_db("SELECT COUNT(*) FROM USER", []))[0]["COUNT(*)"];
			expect(users).toBe(0);
		});
	});

	describe.skip('Register unconfirmed user ("POST /")', () => {
		test("Correctly register a new user", async () => {
			const user = {
				username: "NewUser",
				password: "NewPass",
				email: "e@mail.com",
				name: "Mario",
				surname: "Rossi",
				language: "IT",
			};
			const res = request(app).post(`${baseUrl}`).send(user);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const users = (await query_db("SELECT COUNT(*) FROM UNCONFIRMED_USER", []))[0]["COUNT(*)"];
			expect(users).toBe(1);
		});

		test("Missing username (email used instead)", async () => {
			const user = {
				username: "",
				password: "NewPass",
				email: "e@mail.com",
				name: "Mario",
				surname: "Rossi",
				language: "IT",
			};
			const res = request(app).post(`${baseUrl}`).send(user);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const usernames = await query_db("SELECT Username FROM UNCONFIRMED_USER", []);
			expect(usernames.length).toBe(1);
			expect(usernames[0]["Username"]).toBe("e@mail.com");
		});

		test("Missing password", async () => {
			const user = {
				username: "NewUser",
				password: "",
				email: "e@mail.com",
				name: "Mario",
				surname: "Rossi",
				language: "IT",
			};
			const res = request(app).post(`${baseUrl}`).send(user);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const users = (await query_db("SELECT COUNT(*) FROM UNCONFIRMED_USER", []))[0]["COUNT(*)"];
			expect(users).toBe(0);
		});

		test("Missing email", async () => {
			const user = {
				username: "NewUser",
				password: "NewPass",
				email: "",
				name: "Mario",
				surname: "Rossi",
				language: "IT",
			};
			const res = request(app).post(`${baseUrl}`).send(user);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const users = (await query_db("SELECT COUNT(*) FROM UNCONFIRMED_USER", []))[0]["COUNT(*)"];
			expect(users).toBe(0);
		});

		test("Invalid email (missing @)", async () => {
			const user = {
				username: "NewUser",
				password: "NewPass",
				email: "hello",
				name: "Mario",
				surname: "Rossi",
				language: "IT",
			};
			const res = request(app).post(`${baseUrl}`).send(user);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const users = (await query_db("SELECT COUNT(*) FROM UNCONFIRMED_USER", []))[0]["COUNT(*)"];
			expect(users).toBe(0);
		});

		test("Invalid email (no . after @)", async () => {
			const user = {
				username: "NewUser",
				password: "NewPass",
				email: "e@mail",
				name: "Mario",
				surname: "Rossi",
				language: "IT",
			};
			const res = request(app).post(`${baseUrl}`).send(user);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const users = (await query_db("SELECT COUNT(*) FROM UNCONFIRMED_USER", []))[0]["COUNT(*)"];
			expect(users).toBe(0);
		});

		test("Missing name", async () => {
			const user = {
				username: "NewUser",
				password: "NewPass",
				email: "e@mail.com",
				name: "",
				surname: "Rossi",
				language: "IT",
			};
			const res = request(app).post(`${baseUrl}`).send(user);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const users = (await query_db("SELECT COUNT(*) FROM UNCONFIRMED_USER", []))[0]["COUNT(*)"];
			expect(users).toBe(0);
		});

		test("Missing surname", async () => {
			const user = {
				username: "NewUser",
				password: "NewPass",
				email: "e@mail.com",
				name: "Mario",
				surname: "",
				language: "IT",
			};
			const res = request(app).post(`${baseUrl}`).send(user);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const users = (await query_db("SELECT COUNT(*) FROM UNCONFIRMED_USER", []))[0]["COUNT(*)"];
			expect(users).toBe(0);
		});

		test("Missing language", async () => {
			const user = {
				username: "NewUser",
				password: "NewPass",
				email: "e@mail.com",
				name: "Mario",
				surname: "Rossi",
				language: "",
			};
			const res = request(app).post(`${baseUrl}`).send(user);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const users = (await query_db("SELECT COUNT(*) FROM UNCONFIRMED_USER", []))[0]["COUNT(*)"];
			expect(users).toBe(0);
		});

		test("Username already taken", async () => {
			await insertUser();

			const user = {
				username: "User123",
				password: "NewPass",
				email: "e@mail.com",
				name: "Mario",
				surname: "Rossi",
				language: "IT",
			};
			const res = request(app).post(`${baseUrl}`).send(user);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(409);

			const users = (await query_db("SELECT COUNT(*) FROM UNCONFIRMED_USER", []))[0]["COUNT(*)"];
			expect(users).toBe(0);
		});

		test("Username already taken (unconfirmed)", async () => {
			await insertUser("User123", "pwd", 123456789, "user@name.com", "Mario", "Rossi", "IT", false);

			const user = {
				username: "User456",
				password: "NewPass",
				email: "e@mail.com",
				name: "Mario",
				surname: "Rossi",
				language: "IT",
			};
			const res = request(app).post(`${baseUrl}`).send(user);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(409);

			const users = (await query_db("SELECT COUNT(*) FROM UNCONFIRMED_USER", []))[0]["COUNT(*)"];
			expect(users).toBe(1);
		});
	});

	describe.skip('Delete user ("DELETE /")', () => {
		test("Successful", async () => {
			await insertUser();

			const cookie = await login();
			const res = request(app).delete(`${baseUrl}`).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const users = (await query_db("SELECT COUNT(*) FROM USER", []))[0]["COUNT(*)"];
			expect(users).toBe(0);
		});

		test("Not logged in", async () => {
			await insertUser();
			const res = request(app).delete(`${baseUrl}`);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);

			const users = (await query_db("SELECT COUNT(*) FROM USER", []))[0]["COUNT(*)"];
			expect(users).toBe(1);
		});
	});
});
