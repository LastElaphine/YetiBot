import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { SoundClip } from "../types/database.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [".mp3", ".wav", ".ogg", ".flac", ".m4a"];

const SOUNDS_DIR = resolve(process.cwd(), "data", "sounds");

class SoundUtil {
	private static instance: SoundUtil;

	private constructor() {}

	public static getInstance(): SoundUtil {
		if (!SoundUtil.instance) {
			SoundUtil.instance = new SoundUtil();
		}
		return SoundUtil.instance;
	}

	public async ensureSoundDir(guildId: string): Promise<void> {
		await mkdir(resolve(SOUNDS_DIR, guildId), { recursive: true });
	}

	public getSoundPath(guildId: string, filename: string): string {
		return resolve(SOUNDS_DIR, guildId, filename);
	}

	public generateSoundId(): string {
		return randomUUID();
	}

	public isValidSoundFile(
		filename: string | undefined,
		contentType: string | undefined,
		fileSize: number,
	): { valid: boolean; error?: string } {
		if (fileSize > MAX_FILE_SIZE) {
			return {
				valid: false,
				error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
			};
		}

		const ext = this.getExtension(filename, contentType);
		if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
			return {
				valid: false,
				error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
			};
		}

		return { valid: true, ext };
	}

	public getExtension(
		filename?: string,
		contentType?: string,
	): string | undefined {
		if (filename?.includes(".")) {
			return filename.toLowerCase().slice(filename.lastIndexOf("."));
		}

		const map: Record<string, string> = {
			"audio/mpeg": ".mp3",
			"audio/wav": ".wav",
			"audio/wave": ".wav",
			"audio/x-wav": ".wav",
			"audio/ogg": ".ogg",
			"audio/flac": ".flac",
			"audio/mp4": ".m4a",
			"audio/x-m4a": ".m4a",
		};
		return contentType ? map[contentType.toLowerCase()] : undefined;
	}

	public async saveSoundFile(
		guildId: string,
		soundId: string,
		attachment: { url: string; filename?: string; contentType?: string },
	): Promise<{ filename: string }> {
		await this.ensureSoundDir(guildId);

		const ext =
			this.getExtension(attachment.filename, attachment.contentType) || ".mp3";
		const filename = `${soundId}${ext}`;
		const filepath = this.getSoundPath(guildId, filename);

		const response = await fetch(attachment.url);
		if (!response.ok) {
			throw new Error(`Failed to download sound: ${response.statusText}`);
		}

		const arrayBuffer = await response.arrayBuffer();
		await writeFile(filepath, new Uint8Array(arrayBuffer));

		return { filename };
	}

	public async deleteSoundFile(
		guildId: string,
		filename: string,
	): Promise<boolean> {
		try {
			const filepath = this.getSoundPath(guildId, filename);
			await rm(filepath);
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
