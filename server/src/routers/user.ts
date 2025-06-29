import express, { Router } from "express";
import Authenticator from "./auth";
import ErrorHandler from "../errorHandler";

/**
 * Represents a class that defines the routes for handling users.
 */
class UserRoutes {
	private router: Router;
	private authService: Authenticator;
	private errorHandler: ErrorHandler;

	/**
	 * Constructs a new instance of the UserRoutes class.
	 * @param authenticator The authenticator object used for authentication.
	 */
	constructor(authenticator: Authenticator) {
		this.authService = authenticator;
		this.router = express.Router();
		this.errorHandler = new ErrorHandler();
		this.initRoutes();
	}

	/**
	 * Get the router instance.
	 * @returns The router instance.
	 */
	getRouter(): Router {
		return this.router;
	}

	/**
	 * Initializes the routes for the user router.
	 *
	 * @remarks
	 * This method sets up the HTTP routes for creating, retrieving, updating, and deleting user data.
	 * It can (and should!) apply authentication, authorization, and validation middlewares to protect the routes.
	 */
	initRoutes() {
		this.router.get(
			"/",
			this.errorHandler.validateRequest,
			(req: any, res: any, next: any) => res.status(200).json("Ciao"),
		);
	}
}

export default UserRoutes;
