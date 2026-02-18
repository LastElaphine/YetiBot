import { resolve } from "node:path";

const DATA_DIR = resolve(Deno.cwd(), "data");
const BACKUP_DIR = resolve(DATA_DIR, "backups");
const DB_FILE = resolve(DATA_DIR, "db.json");

export const paths = {
	dataDir: DATA_DIR,
	backupDir: BACKUP_DIR,
	dbFile: DB_FILE,
};

export const ensureDirectories = async (): Promise<void> => {
	await Deno.mkdir(paths.dataDir, { recursive: true });
	await Deno.mkdir(paths.backupDir, { recursive: true });
};
