import { query_db } from "./utils";

abstract class UpdatesTable {
	cookie: string;
	abstract readonly tableName: string;
	protected readonly params = () => ["DeviceId"];

	constructor(cookie: string) {
		this.cookie = cookie;
	}

	protected paramValues: () => (string | number)[] = () => [this.cookie];

	hasUpdate = (): Promise<boolean> => {
		return new Promise<boolean>(async (resolve, reject) => {
			const paramChecks = this.params().map((name) => `${name}=?`);
			const query = `SELECT COUNT(*) FROM ${this.tableName} WHERE ${paramChecks.join(" AND ")}`;
			const res = await query_db(query, this.paramValues());

			resolve(res.length == 1 && res[0]["COUNT(*)"] == 1);
		});
	};
}

abstract class UpdatesTableTwoParams extends UpdatesTable {
	abstract readonly otherParamName: string;
	protected override params = () => ["DeviceId", this.otherParamName];
	otherId: number;

	constructor(cookie: string, otherId: number) {
		super(cookie);
		this.otherId = otherId;
	}

	protected override paramValues = () => [this.cookie, this.otherId];
}

export class UpdatesUserData extends UpdatesTable {
	tableName = "UPDATES_USER_DATA";
}

export class UpdatesPlaylistTemplate extends UpdatesTableTwoParams {
	tableName = "UPDATES_PLAYLIST_TEMPLATE";
	otherParamName = "TemplateId";
}

export class UpdatesLibrary extends UpdatesTable {
	tableName = "UPDATES_LIBRARY";
}

export class UpdatesSongSearch extends UpdatesTable {
	tableName = "UPDATES_SONG_SEARCH";
}

export class UpdatesCustomPermission extends UpdatesTableTwoParams {
	tableName = "UPDATES_CUSTOM_PERMISSION";
	otherParamName = "BookId";
}

export class UpdatesPlaylist extends UpdatesTableTwoParams {
	tableName = "UPDATES_PLAYLIST";
	otherParamName = "PlaylistId";
}

export class UpdatesBookInfo extends UpdatesTableTwoParams {
	tableName = "UPDATES_BOOK_INFO";
	otherParamName = "BookId";
}

export class UpdatesVariantOpen extends UpdatesTable {
	tableName = "UPDATES_VARIANT_OPEN";
}

export class UpdatesSong extends UpdatesTableTwoParams {
	tableName = "UPDATES_SONG";
	otherParamName = "SongId";
}

export class UpdatesSongVariant extends UpdatesTableTwoParams {
	tableName = "UPDATES_SONG_VARIANT";
	otherParamName = "VariantId";
}
