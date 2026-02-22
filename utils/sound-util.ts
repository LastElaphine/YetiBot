import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import type { SoundClip } from "../types/database.ts";
import { paths } from "./path-config.ts";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [".mp3", ".wav", ".ogg", ".flac", ".m4a"];

class SoundUtil {
	private static instance: SoundUtil;

	private constructor() {}

	public static getInstance(): SoundUtil {
		if (!SoundUtil.instance) {
			SoundUtil.instance = new SoundUtil();
		}
		return SoundUtil.instance;
	}

	public generateSoundId(): string {
		return randomUUID();
	}

	public isValidSoundFile(
		filename: string | undefined,
		fileSize: number,
	): { valid: boolean; error?: string } {
		if (!filename || typeof filename !== "string") {
			return { valid: false, error: "Invalid filename" };
		}

		const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));

		if (!ALLOWED_EXTENSIONS.includes(ext)) {
			return {
				valid: false,
				error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
			};
		}

		if (fileSize > MAX_FILE_SIZE) {
			return {
				valid: false,
				error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
			};
		}

		return { valid: true };
	}

	public getSoundPath(guildId: string, filename: string): string {
		return resolve(paths.soundsDir, guildId, filename);
	}

	public getSoundDir(guildId: string): string {
		return resolve(paths.soundsDir, guildId);
	}

	public async saveSoundFile(
		guildId: string,
		soundId: string,
		attachment: { url: string; filename: string },
	): Promise<{ path: string; filename: string }> {
		const soundDir = this.getSoundDir(guildId);
		await Deno.mkdir(soundDir, { recursive: true });

		const ext = attachment.filename.slice(attachment.filename.lastIndexOf("."));
		const newFilename = `${soundId}${ext}`;
		const soundPath = this.getSoundPath(guildId, newFilename);

		const response = await fetch(attachment.url);
		if (!response.ok) {
			throw new Error(`Failed to download sound file: ${response.statusText}`);
		}

		const arrayBuffer = await response.arrayBuffer();
		await Deno.writeFile(soundPath, new Uint8Array(arrayBuffer));

		return { path: soundPath, filename: newFilename };
	}

	public async deleteSoundFile(
		guildId: string,
		filename: string,
	): Promise<boolean> {
		try {
			const soundPath = this.getSoundPath(guildId, filename);
			await Deno.remove(soundPath);
			return true;
		} catch {
			return false;
		}
	}

	public async fileExists(path: string): Promise<boolean> {
		try {
			await Deno.stat(path);
			return true;
		} catch {
			return false;
		}
	}

	public createSoundClip(
		id: string,
		name: string,
		filename: string,
		uploadedBy: string,
		fileSize: number,
	): SoundClip {
		return {
			id,
			name,
			filename,
			uploadedBy,
			uploadedAt: new Date(),
			fileSize,
		};
	}

	public formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
}

export const soundUtil = SoundUtil.getInstance();
