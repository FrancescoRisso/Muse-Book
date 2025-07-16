import { describe, test, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import { clearDB } from "./utils";
import db from "../db/db";
import { createHash } from "crypto";

const testPwd = "pwd";
const testSalt = 123456789;
const testHash = createHash("sha256").update(`${testPwd}${testSalt}`).digest("hex");

const sessionDb = `
INSERT INTO USER(Username, Salt, Hash, Email, Name, Surname, Language)
VALUES("User123", ${testSalt}, "${testHash}", "user@name.com", "Mario", "Rossi", "IT");
`;

beforeEach(() => {
	clearDB()
		// .then(() => db.run(sessionDb))
		.catch((err) => console.error(err));
});

const baseUrl = "/musebook/api/session";

describe("Access APIs", () => {
	describe('"POST /"', () => {
		test("", async () => {});
	});
});
