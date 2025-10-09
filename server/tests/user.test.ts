import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import { clearDB, insertBook, insertSong, insertUser, insertUserSearchSong, login, query_db } from "./utils";
import { app } from "../index";
import moment from "moment";
import { createHash } from "crypto";

beforeEach(clearDB);

const baseUrl = "/musebook/api/user";

describe.skip(`User APIs ("${baseUrl}")`, () => {
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

	describe.skip('Get list of user song searches ("GET /search-song")', () => {
		test("Successful (with 0 song)", async () => {
			await insertUser();

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/search-song`).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toBe([]);
		});

		test("Successful (with 1 song)", async () => {
			const user = await insertUser();
			const book = await insertBook(user);
			const song = await insertSong(book, "Song");
			await insertUserSearchSong(user, song, "2025-01-01");

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/search-song`).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toBe([song]);
		});

		test("Successful (with more songs)", async () => {
			const user = await insertUser();
			const book = await insertBook(user);
			const song1 = await insertSong(book, "Song1");
			const song2 = await insertSong(book, "Song2");
			const song3 = await insertSong(book, "Song3");
			await insertUserSearchSong(user, song3, "2025-01-01");
			await insertUserSearchSong(user, song1, "2025-01-02");
			await insertUserSearchSong(user, song2, "2025-01-03");

			const cookie = await login();
			const res = request(app).get(`${baseUrl}/search-song`).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);
			expect((await res).body).toBe([song2, song1, song3]);
		});

		test("Not logged in", async () => {
			const user = await insertUser();

			const res = request(app).get(`${baseUrl}/search-song`);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);
		});
	});

	describe.skip('Add new user search ("POST /search-song")', () => {
		test("Successful (today)", async () => {
			const user = await insertUser();
			const book = await insertBook(user);
			const song = await insertSong(book);

			const data = { id: song, date: moment().format("YYYY-MM-DD") };

			const cookie = await login();
			const res = request(app).post(`${baseUrl}/search-song`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const searches = await query_db("SELECT SongId FROM USER_SONG_SEARCH WHERE USER=?", [user]);
			expect(searches.length).toBe(1);
			expect(searches[0]["SongId"]).toBe(song);
		});

		test("Successful (past date)", async () => {
			const user = await insertUser();
			const book = await insertBook(user);
			const song = await insertSong(book);

			const data = { id: song, date: moment().subtract(1, "days").format("YYYY-MM-DD") };

			const cookie = await login();
			const res = request(app).post(`${baseUrl}/search-song`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const searches = await query_db("SELECT SongId FROM USER_SONG_SEARCH WHERE USER=?", [user]);
			expect(searches.length).toBe(1);
			expect(searches[0]["SongId"]).toBe(song);
		});

		test("Future date", async () => {
			const user = await insertUser();
			const book = await insertBook(user);
			const song = await insertSong(book);

			const data = { id: song, date: moment().add(1, "days").format("YYYY-MM-DD") };

			const cookie = await login();
			const res = request(app).post(`${baseUrl}/search-song`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);

			const searches = await query_db("SELECT SongId FROM USER_SONG_SEARCH WHERE USER=?", [user]);
			expect(searches.length).toBe(0);
		});

		test("Non-existing song", async () => {
			const user = await insertUser();

			const data = { id: 1, date: moment().format("YYYY-MM-DD") };

			const cookie = await login();
			const res = request(app).post(`${baseUrl}/search-song`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(403);

			const searches = await query_db("SELECT SongId FROM USER_SONG_SEARCH WHERE USER=?", [user]);
			expect(searches.length).toBe(0);
		});

		test("Non-accessible song", async () => {
			const user = await insertUser();
			const otherUser = await insertUser("OtherUser");
			const book = await insertBook(otherUser, "Book", "A book", "-");
			const song = await insertSong(book);

			const data = { id: song, date: moment().format("YYYY-MM-DD") };

			const cookie = await login();
			const res = request(app).post(`${baseUrl}/search-song`).send(data).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(403);

			const searches = await query_db("SELECT SongId FROM USER_SONG_SEARCH WHERE USER=?", [user]);
			expect(searches.length).toBe(0);
		});

		test("Not logged in", async () => {
			const user = await insertUser();
			const book = await insertBook(user);
			const song = await insertSong(book);

			const data = { id: song, date: moment().format("YYYY-MM-DD") };

			const res = request(app).post(`${baseUrl}/search-song`).send(data);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);

			const searches = await query_db("SELECT SongId FROM USER_SONG_SEARCH WHERE USER=?", [user]);
			expect(searches.length).toBe(0);
		});
	});

	describe.skip('Change user data ("PATCH /")', () => {
		const userDataChanger = async (
			username: string,
			password: string,
			name: string,
			surname: string,
			language: string,
			id: number,
		) => {
			const toSend = { username, password, name, surname, language };

			const { Salt: salt, Email: email } = (await query_db("SELECT Salt, Email FROM USER WHERE Id=?", [id]))[0];

			const expected = {
				Username: username || email,
				Email: email,
				Name: name,
				Surname: surname,
				Language: language,
				Hash: createHash("sha256").update(`${toSend.password}${salt}`).digest("hex"),
				Id: id,
				Salt: salt,
			};

			return [toSend, expected];
		};

		test("Correctly change data", async () => {
			const id = await insertUser();
			const [user, user_expected] = await userDataChanger("NewUser", "NewPass", "Luca", "Bianchi", "EN", id);

			const cookie = await login();
			const res = request(app).patch(`${baseUrl}`).send(user).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const user_db = (await query_db(`SELECT * FROM USER WHERE Id=?`, [id]))[0];
			expect(user_db).toEqual(user_expected);
		});

		test("Correctly change data (no username)", async () => {
			const id = await insertUser();
			const [user, user_expected] = await userDataChanger("", "NewPass", "Luca", "Bianchi", "EN", id);

			const cookie = await login();
			const res = request(app).patch(`${baseUrl}`).send(user).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(200);

			const user_db = (await query_db(`SELECT * FROM USER WHERE Id=?`, [id]))[0];
			expect(user_db).toEqual(user_expected);
		});

		const checkMissingDataAPI = async (user: Record<string, string>) => {
			const id = await insertUser();

			const cookie = await login();
			const res = request(app).patch(`${baseUrl}`).send(user).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(422);
		};

		test("Missing username", async () => {
			await checkMissingDataAPI({
				password: "NewPass",
				name: "Luca",
				surname: "Bianchi",
				language: "EN",
			});
		});

		test("Empty password", async () => {
			await checkMissingDataAPI({
				username: "NewUser",
				password: "",
				name: "Luca",
				surname: "Bianchi",
				language: "EN",
			});
		});

		test("Missing password", async () => {
			await checkMissingDataAPI({
				username: "NewUser",
				name: "Luca",
				surname: "Bianchi",
				language: "EN",
			});
		});

		test("Empty name", async () => {
			await checkMissingDataAPI({
				username: "NewUser",
				password: "NewPass",
				name: "",
				surname: "Bianchi",
				language: "EN",
			});
		});

		test("Missing name", async () => {
			await checkMissingDataAPI({
				username: "NewUser",
				password: "NewPass",
				surname: "Bianchi",
				language: "EN",
			});
		});

		test("Empty surname", async () => {
			await checkMissingDataAPI({
				username: "NewUser",
				password: "NewPass",
				name: "Luca",
				surname: "",
				language: "EN",
			});
		});

		test("Missing surname", async () => {
			await checkMissingDataAPI({
				username: "NewUser",
				password: "NewPass",
				name: "Luca",
				language: "EN",
			});
		});

		test("Missing language", async () => {
			await checkMissingDataAPI({
				username: "NewUser",
				password: "NewPass",
				name: "Luca",
				surname: "Bianchi",
			});
		});

		test("Empty language", async () => {
			await checkMissingDataAPI({
				username: "NewUser",
				password: "NewPass",
				name: "Luca",
				surname: "Bianchi",
				language: "",
			});
		});

		test("Not logged in", async () => {
			const id = await insertUser();
			const user = { username: "NewUser", password: "NewPass", name: "Luca", surname: "Bianchi", language: "EN" };

			const res = request(app).patch(`${baseUrl}`).send(user);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(401);
		});

		test("Username taken", async () => {
			await insertUser();
			await insertUser("NewUser");
			const user = { username: "NewUser", password: "NewPass", name: "Luca", surname: "Bianchi", language: "EN" };

			const cookie = await login();
			const res = request(app).patch(`${baseUrl}`).send(user).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(409);
		});

		test("Username taken (not confirmed)", async () => {
			await insertUser();
			await insertUser("NewUser", "pwd", 111, "new@user.com", "Giorgio", "Verdi", "IT", false);
			const user = { username: "NewUser", password: "NewPass", name: "Luca", surname: "Bianchi", language: "EN" };

			const cookie = await login();
			const res = request(app).patch(`${baseUrl}`).send(user).set("Cookie", cookie);

			await expect(res).resolves.toBeDefined();
			expect((await res).status).toBe(409);
		});
	});
});
