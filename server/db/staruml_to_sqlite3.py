import re

if __name__ =="__main__":
	FILE = "./test"

	table_name_def_matcher = re.compile(r"CREATE TABLE `([^`]*)`([^;]*);", re.MULTILINE)
	foreign_keys_matcher = re.compile(r"ALTER TABLE `([^`]*)` ADD FOREIGN KEY \(`([^`]*)`\) REFERENCES `([^`]*)`\(`([^`]*)`\)")

	with open(FILE, "r") as f:
		text = "".join(f.readlines())
		
		tables = {}

		while True:
			try:
				m = re.search(table_name_def_matcher, text)
				table_def, tab_name, tab_def = m.group(0), m.group(1), m.group(2)[:-2]
				text = text.replace(table_def, "")

				m = re.search(table_name_def_matcher, table_def)
				tab_name, tab_def = m.group(1), m.group(2)[:-2]

				tables[tab_name] = tab_def

			except AttributeError:
				break

		while True:
			try:
				m = re.search(foreign_keys_matcher, text)
				table_alter = m.group(0)
				text = text.replace(table_alter, "")

				src_tab, src_col = m.group(1), m.group(2)
				dst_tab, dst_col = m.group(3), m.group(4)

				tables[src_tab] = f"{tables[src_tab]},\n\tFOREIGN KEY (`{src_col}`) REFERENCES `{dst_tab}`(`{dst_col}`)"

			except AttributeError:
				break

	out = "PRAGMA FOREIGN_KEYS = 0;\n"

	for table in tables.keys():
		out = f"{out}DROP TABLE IF EXISTS `{table}`;\n"
	
	out = f"{out}PRAGMA FOREIGN_KEYS = 1;\n"

	for name, tdef in tables.items():
		out = f"{out}\nCREATE TABLE `{name}`{tdef}\n);\n"
		
	with open(FILE, "w") as f:
		f.write(out)

