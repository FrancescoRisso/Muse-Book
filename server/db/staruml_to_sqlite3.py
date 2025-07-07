import re

ON_DELETE: dict[str, list[tuple[str, str, str, str]]] = {
    "BOOK": [
        ("Owner", "USER", "Id", "CASCADE"),
        ("UnconfirmedNewOwner", "USER", "Id", "SET NULL"),
    ],
    "SONG": [("BookId", "BOOK", "Id", "CASCADE")],
    "SONG_VARIANT": [("SongId", "SONG", "Id", "CASCADE")],
    "SONG_IMAGES": [
        ("VariantId", "SONG_VARIANT", "Id", "CASCADE"),
        ("ImageId", "SONG_IMAGE_DATA", "Id", "RESTRICT"),
    ],
    "VARIANT_LAST_OPENED_DATE": [
        ("VariantId", "SONG_VARIANT", "Id", "CASCADE"),
        ("UserId", "USER", "Id", "CASCADE"),
    ],
    "PLAYLIST": [("Owner", "USER", "Id", "CASCADE")],
    "SONG_IN_PLAYLIST": [
        ("PlaylistId", "PLAYLIST", "Id", "CASCADE"),
        ("SongId", "SONG", "Id", "SET NULL"),
    ],
    "USER_SONG_SEARCH": [
        ("SongId", "SONG", "Id", "SET NULL"),
        ("UserId", "USER", "Id", "CASCADE"),
    ],
    "PLAYLIST_TEMPLATE": [("Owner", "USER", "Id", "CASCADE")],
    "PLAYLIST_TEMPLATE_ITEM": [("TemplateId", "PLAYLIST_TEMPLATE", "Id", "CASCADE")],
    "USER_HAS_IN_LIBRARY": [
        ("BookId", "BOOK", "Id", "CASCADE"),
        ("UserId", "USER", "Id", "CASCADE"),
    ],
    "BOOK_CUSTOM_PERMISSION": [
        ("BookId", "BOOK", "Id", "CASCADE"),
        ("UserId", "USER", "Id", "CASCADE"),
    ],
    "LOGGED_IN_DEVICES": [("Owner", "USER", "Id", "CASCADE")],
    "UPDATES_USER_DATA": [("DeviceId", "LOGGED_IN_DEVICES", "Id", "CASCADE")],
    "UPDATES_PLAYLIST_TEMPLATE": [
        ("DeviceId", "LOGGED_IN_DEVICES", "Id", "CASCADE"),
        ("TemplateId", "PLAYLIST_TEMPLATE", "Id", "SET NULL"),
    ],
    "UPDATES_LIBRARY": [("DeviceId", "LOGGED_IN_DEVICES", "Id", "CASCADE")],
    "UPDATES_SONG_SEARCH": [("DeviceId", "LOGGED_IN_DEVICES", "Id", "CASCADE")],
    "UPDATES_CUSTOM_PERMISSION": [
        ("DeviceId", "LOGGED_IN_DEVICES", "Id", "CASCADE"),
        ("BookId", "BOOK", "Id", "CASCADE"),
    ],
    "UPDATES_PLAYLIST": [
        ("DeviceId", "LOGGED_IN_DEVICES", "Id", "CASCADE"),
        ("PlaylistId", "PLAYLIST", "Id", "SET NULL"),
    ],
    "UPDATES_BOOK_INFO": [
        ("DeviceId", "LOGGED_IN_DEVICES", "Id", "CASCADE"),
        ("BookId", "BOOK", "Id", "SET NULL"),
    ],
    "UPDATES_VARIANT_OPEN": [("DeviceId", "LOGGED_IN_DEVICES", "Id", "CASCADE")],
    "UPDATES_SONG": [
        ("DeviceId", "LOGGED_IN_DEVICES", "Id", "CASCADE"),
        ("SongId", "SONG", "Id", "SET NULL"),
    ],
    "UPDATES_SONG_VARIANT": [
        ("DeviceId", "LOGGED_IN_DEVICES", "Id", "CASCADE"),
        ("VariantId", "SONG_VARIANT", "Id", "SET NULL"),
    ],
    "UPDATES_SONG_IMAGE_DATA": [
        ("DeviceId", "LOGGED_IN_DEVICES", "Id", "CASCADE"),
        ("ImageId", "SONG_IMAGE_DATA", "Id", "SET NULL"),
    ],
}


if __name__ == "__main__":
    FILE = "./db-creation-script.sqlite3"

    table_name_def_matcher = re.compile(r"CREATE TABLE `([^`]*)`([^;]*);", re.MULTILINE)
    foreign_keys_matcher = re.compile(
        r"ALTER TABLE `([^`]*)` ADD FOREIGN KEY \(`([^`]*)`\) REFERENCES `([^`]*)`\(`([^`]*)`\)"
    )

    with open(FILE, "r") as f:
        text = "".join(f.readlines())

        tables: dict[str, str] = {}

        while True:
            try:
                m = re.search(table_name_def_matcher, text)
                assert m is not None

                table_def, tab_name, tab_def = m.group(0), m.group(1), m.group(2)[:-2]
                text = text.replace(table_def, "")

                m = re.search(table_name_def_matcher, table_def)
                assert m is not None

                tab_name, tab_def = m.group(1), m.group(2)[:-2]

                tables[tab_name] = tab_def

            except (AttributeError, AssertionError):
                break

        warn_printed = False

        while True:
            try:
                m = re.search(foreign_keys_matcher, text)
                assert m is not None

                table_alter = m.group(0)
                text = text.replace(table_alter, "")

                src_tab, src_col = m.group(1), m.group(2)
                dst_tab, dst_col = m.group(3), m.group(4)

                if src_tab not in ON_DELETE:
                    ON_DELETE[src_tab] = []

                for rule_sc, rule_dt, rule_dc, rule_act in ON_DELETE[src_tab]:
                    if (rule_sc, rule_dt, rule_dc) == (src_col, dst_tab, dst_col):
                        action: str | None = rule_act
                        break
                else:
                    if not warn_printed:
                        print(
                            "WARN: these foreign keys don't have a ON DELETE policy (maybe it's a typo in the python file?):"
                        )
                        warn_printed = True
                    print(
                        f"- in table `{src_tab}`: FOREIGN KEY (`{src_col}`) REFERENCES `{dst_tab}`(`{dst_col}`)"
                    )
                    action = None

                tables[src_tab] = (
                    f"{tables[src_tab]},"
                    + f"\n\tFOREIGN KEY (`{src_col}`) REFERENCES `{dst_tab}`(`{dst_col}`) "
                    + (f"ON DELETE {action}" if action is not None else "")
                )

            except (AttributeError, AssertionError):
                break

    out = "PRAGMA FOREIGN_KEYS = 0;\n"

    for table in tables.keys():
        out = f"{out}DROP TABLE IF EXISTS `{table}`;\n"

    out = f"{out}PRAGMA FOREIGN_KEYS = 1;\n"

    for name, tdef in tables.items():
        out = f"{out}\nCREATE TABLE `{name}`{tdef}\n);\n"

    with open(FILE, "w") as f:
        f.write(out)

    print("Done!")
