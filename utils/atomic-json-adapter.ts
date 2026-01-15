import type { Adapter } from "npm:lowdb";

export class AtomicJSONFile<T> implements Adapter<T> {
	constructor(public filename: string) {}

	async read(): Promise<T | null> {
		try {
			const data = await Deno.readTextFile(this.filename);
			return this.reviveMaps(JSON.parse(data));
		} catch (error) {
			if (error instanceof Deno.errors.NotFound) {
				return null;
			}
			throw error;
		}
	}

	async write(data: T): Promise<void> {
		const tempFile = `${this.filename}.tmp.${Date.now()}`;
		const jsonString = JSON.stringify(data, this.mapReplacer, 2);

		try {
			await Deno.writeTextFile(tempFile, jsonString);
			await Deno.rename(tempFile, this.filename);
		} catch (error) {
			try {
				await Deno.remove(tempFile);
			} catch {
				// Ignore cleanup errors
			}
			throw error;
		}
	}

	private mapReplacer(key: string, value: any): any {
		if (value instanceof Map) {
			return { _type: "Map", _value: Array.from(value.entries()) };
		}
		return value;
	}

	private reviveMaps(obj: any): any {
		if (obj && typeof obj === "object") {
			if (obj._type === "Map") {
				return new Map(obj._value);
			}
			for (const key in obj) {
				obj[key] = this.reviveMaps(obj[key]);
			}
		}
		return obj;
	}
}
