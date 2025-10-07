import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import { clearDB, insertDefaultUser, login, query_db } from "./utils";
import { app } from "../index";
import { createHash } from "crypto";

beforeEach(() => {
	return new Promise<void>((resolve, reject) => {
		clearDB()
			.then(() => insertDefaultUser().then(resolve).catch(reject))
			.catch(reject);
	});
});

const baseUrl = "/musebook/api/session";

describe(`Access APIs ("${baseUrl}")`, () => {
	describe.skip('Login ("POST /")', () => {
		test("Successful login", async () => {
			const user = { username: "User123", password: "pwd" };
			const res = request(app).post(baseUrl).send(user);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const logged_devices = (await query_db("SELECT COUNT(*) FROM LOGGED_IN_DEVICES", []))[0]["COUNT(*)"];
			expect(logged_devices).toBe(1);
		});

		test("Successful login on another device", async () => {
			login();
			login();

			const logged_devices = (await query_db("SELECT COUNT(*) FROM LOGGED_IN_DEVICES", []))[0]["COUNT(*)"];
			expect(logged_devices).toBe(2);
		});

		test("Missing username", async () => {
			const user = { password: "pwd" };
			const res = request(app).post(baseUrl).send(user);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const logged_devices = (await query_db("SELECT COUNT(*) FROM LOGGED_IN_DEVICES", []))[0]["COUNT(*)"];
			expect(logged_devices).toBe(0);
		});

		test("Missing password", async () => {
			const user = { username: "User123" };
			const res = request(app).post(baseUrl).send(user);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const logged_devices = (await query_db("SELECT COUNT(*) FROM LOGGED_IN_DEVICES", []))[0]["COUNT(*)"];
			expect(logged_devices).toBe(0);
		});

		test("Empty username", async () => {
			const user = { username: "User123", password: "" };
			const res = request(app).post(baseUrl).send(user);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const logged_devices = (await query_db("SELECT COUNT(*) FROM LOGGED_IN_DEVICES", []))[0]["COUNT(*)"];
			expect(logged_devices).toBe(0);
		});

		test("Empty password", async () => {
			const user = { username: "", password: "pwd" };
			const res = request(app).post(baseUrl).send(user);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const logged_devices = (await query_db("SELECT COUNT(*) FROM LOGGED_IN_DEVICES", []))[0]["COUNT(*)"];
			expect(logged_devices).toBe(0);
		});

		test("Wrong password", async () => {
			const user = { username: "User123", password: "wrong" };
			const res = request(app).post(baseUrl).send(user);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);

			const logged_devices = (await query_db("SELECT COUNT(*) FROM LOGGED_IN_DEVICES", []))[0]["COUNT(*)"];
			expect(logged_devices).toBe(0);
		});

		test("Non-existing username", async () => {
			const user = { username: "User456", password: "pwd" };
			const res = request(app).post(baseUrl).send(user);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);

			const logged_devices = (await query_db("SELECT COUNT(*) FROM LOGGED_IN_DEVICES", []))[0]["COUNT(*)"];
			expect(logged_devices).toBe(0);
		});
	});

	describe.skip('Logout ("DELETE /")', () => {
		test("Successful logout", async () => {
			const cookie = await login();

			const res = request(app).delete(baseUrl).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const logged_devices = (await query_db("SELECT COUNT(*) FROM LOGGED_IN_DEVICES", []))[0]["COUNT(*)"];
			expect(logged_devices).toBe(0);
		});

		test("Successful logout with 2 logged devices", async () => {
			const cookie1 = await login();
			const cookie2 = await login();

			const res = request(app).delete(baseUrl).set("Cookie", cookie2);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const logged_devices = (await query_db("SELECT COUNT(*) FROM LOGGED_IN_DEVICES", []))[0]["COUNT(*)"];
			expect(logged_devices).toBe(1);
		});

		test("Logout of not logged in user", async () => {
			const res = request(app).delete(baseUrl);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);

			const logged_devices = (await query_db("SELECT COUNT(*) FROM LOGGED_IN_DEVICES", []))[0]["COUNT(*)"];
			expect(logged_devices).toBe(0);
		});
	});

	describe.skip('Request change password link (GET "/pwd-reset/:email")', () => {
		test("Existing email", async () => {
			const res = request(app).get(`${baseUrl}/pwd-reset/user@name.com`);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
		});

		test("Non existing email", async () => {
			const res = request(app).get(`${baseUrl}/pwd-reset/userFake@name.com`);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);
		});

		test("Invalid email (no @)", async () => {
			const res = request(app).get(`${baseUrl}/pwd-reset/username.com`);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);
		});

		test("Invalid email (no . after @)", async () => {
			const res = request(app).get(`${baseUrl}/pwd-reset/user@namecom`);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);
		});
	});

	describe.skip('Change password (POST "/pwd-reset")', () => {
		test("Successful", async () => {
			const { Id: id, Salt: salt } = (await query_db("SELECT Id, Salt FROM USER", []))[0];
			const data = { id, password: "newPassword" };

			const res = request(app).post(`${baseUrl}/pwd-reset`).send(data);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const newHashExpected = createHash("sha256").update(`newPassword${salt}`).digest("hex");
			const newHashDb = (await query_db("SELECT Salt FROM USER", []))[0]["Salt"];
			expect(newHashDb).toBe(newHashExpected);
		});

		test("Non-existing id", async () => {
			const { Id: id, Hash: hash } = (await query_db("SELECT Id, Hash FROM USER", []))[0];
			const data = { id: id + 1, password: "newPassword" };

			const res = request(app).post(`${baseUrl}/pwd-reset`).send(data);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);

			const newHashDb = (await query_db("SELECT Salt FROM USER", []))[0]["Salt"];
			expect(newHashDb).toBe(hash);
		});

		test("Empty password", async () => {
			const { Id: id, Hash: hash } = (await query_db("SELECT Id, Hash FROM USER", []))[0];
			const data = { id: id, password: "" };

			const res = request(app).post(`${baseUrl}/pwd-reset`).send(data);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const newHashDb = (await query_db("SELECT Salt FROM USER", []))[0]["Salt"];
			expect(newHashDb).toBe(hash);
		});
	});
});
