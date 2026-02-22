import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { cwd } from "node:process";

const DATA_DIR = resolve(cwd(), "data");
const BACKUP_DIR = resolve(DATA_DIR, "backups");
const SOUNDS_DIR = resolve(DATA_DIR, "sounds");
const DB_FILE = resolve(DATA_DIR, "db.json");

export const paths = {
	dataDir: DATA_DIR,
	backupDir: BACKUP_DIR,
	soundsDir: SOUNDS_DIR,
	dbFile: DB_FILE,
};

export const ensureDirectories = async (): Promise<void> => {
	await mkdir(paths.dataDir, { recursive: true });
	await mkdir(paths.backupDir, { recursive: true });
	await mkdir(paths.soundsDir, { recursive: true });
};
