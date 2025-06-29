class User {
	private _id: number = 0;

	public static byId(id: number): User {
		throw Error("Not yet implemented");
	}

	public get id() {
		return this._id;
	}
}

export default User;
