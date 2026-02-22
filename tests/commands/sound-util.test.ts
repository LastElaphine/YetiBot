import { assertEquals, assertExists } from "@std/assert";
import { soundUtil } from "../../utils/sound-util.ts";

Deno.test("generateSoundId returns valid UUID", () => {
	const id = soundUtil.generateSoundId();
	assertExists(id);
	assertEquals(id.length, 36);
});

Deno.test("isValidSoundFile accepts mp3 by contentType", () => {
	const result = soundUtil.isValidSoundFile(undefined, "audio/mpeg", 1024);
	assertEquals(result.valid, true);
});

Deno.test("isValidSoundFile accepts wav by contentType", () => {
	const result = soundUtil.isValidSoundFile(undefined, "audio/wav", 1024);
	assertEquals(result.valid, true);
});

Deno.test("isValidSoundFile accepts ogg by contentType", () => {
	const result = soundUtil.isValidSoundFile(undefined, "audio/ogg", 1024);
	assertEquals(result.valid, true);
});

Deno.test("isValidSoundFile accepts flac by contentType", () => {
	const result = soundUtil.isValidSoundFile(undefined, "audio/flac", 1024);
	assertEquals(result.valid, true);
});

Deno.test("isValidSoundFile accepts m4a by contentType", () => {
	const result = soundUtil.isValidSoundFile(undefined, "audio/mp4", 1024);
	assertEquals(result.valid, true);
});

Deno.test("isValidSoundFile rejects invalid contentType", () => {
	const result = soundUtil.isValidSoundFile(undefined, "video/mp4", 1024);
	assertEquals(result.valid, false);
	assertExists(result.error);
});

Deno.test("isValidSoundFile rejects file too large", () => {
	const result = soundUtil.isValidSoundFile(
		undefined,
		"audio/mpeg",
		20 * 1024 * 1024,
	);
	assertEquals(result.valid, false);
	assertExists(result.error);
});

Deno.test("getExtension extracts from filename", () => {
	const ext = soundUtil.getExtension("sound.mp3", undefined);
	assertEquals(ext, ".mp3");
});

Deno.test("getExtension extracts from contentType", () => {
	const ext = soundUtil.getExtension(undefined, "audio/mpeg");
	assertEquals(ext, ".mp3");
});

Deno.test("getExtension prefers filename over contentType", () => {
	const ext = soundUtil.getExtension("sound.mp3", "audio/wav");
	assertEquals(ext, ".mp3");
});

Deno.test("createSoundClip creates valid object", () => {
	const clip = soundUtil.createSoundClip(
		"test-id",
		"My Sound",
		"https://cdn.discordapp.com/sound.mp3",
		"user123",
		1024,
	);
	assertEquals(clip.id, "test-id");
	assertEquals(clip.name, "My Sound");
	assertEquals(clip.url, "https://cdn.discordapp.com/sound.mp3");
	assertEquals(clip.uploadedBy, "user123");
	assertEquals(clip.fileSize, 1024);
	assertExists(clip.uploadedAt);
});

Deno.test("formatFileSize formats bytes", () => {
	assertEquals(soundUtil.formatFileSize(500), "500 B");
});

Deno.test("formatFileSize formats kilobytes", () => {
	assertEquals(soundUtil.formatFileSize(1536), "1.5 KB");
});

Deno.test("formatFileSize formats megabytes", () => {
	assertEquals(soundUtil.formatFileSize(1572864), "1.5 MB");
});
