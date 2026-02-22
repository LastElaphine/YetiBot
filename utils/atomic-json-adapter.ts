import { constants } from "node:fs";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import type { Adapter } from "lowdb";

export class AtomicJSONFile<T> implements Adapter<T> {
	constructor(public filename: string) {}

	async read(): Promise<T | null> {
		try {
			const data = await readFile(this.filename, "utf-8");
			return this.reviveMaps(JSON.parse(data));
		} catch (error) {
			if (
				error instanceof Error &&
				"code" in error &&
				error.code === "ENOENT"
			) {
				return null;
			}
			throw error;
		}
	}

	async write(data: T): Promise<void> {
		const tempFile = `${this.filename}.tmp.${Date.now()}`;
		const jsonString = JSON.stringify(data, this.mapReplacer, 2);

		try {
			await writeFile(tempFile, jsonString);
			await rename(tempFile, this.filename);
		} catch (error) {
			try {
				await rm(tempFile);
			} catch {
				// Ignore cleanup errors
			}
			throw error;
		}
	}

	private mapReplacer(_key: string, value: unknown): unknown {
		if (value instanceof Map) {
			return { _type: "Map", _value: Array.from(value.entries()) };
		}
		return value;
	}

	private reviveMaps(obj: unknown): unknown {
		if (obj && typeof obj === "object") {
			if (obj._type === "Map") {
				const revived = new Map(obj._value);
				for (const [key, value] of revived) {
					revived.set(key, this.reviveMaps(value));
				}
				return revived;
			}
			for (const key in obj) {
				obj[key] = this.reviveMaps(obj[key]);
			}
		}
		return obj;
	}
}
