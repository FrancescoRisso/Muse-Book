import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import { clearDB, insertDefaultUser, login, query_db } from "./utils";
import { app } from "../index";

beforeEach(() => {
	return new Promise<void>((resolve, reject) => {
		clearDB()
			.then(() => insertDefaultUser().then(resolve).catch(reject))
			.catch(reject);
	});
});

const baseUrl = "/musebook/api/session";

describe(`Access APIs ("${baseUrl}")`, () => {
	describe('Login ("POST /")', () => {
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

	describe('Logout ("DELETE /")', () => {
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
});
