import { assertEquals, assertExists } from "@std/assert";
import { soundUtil } from "../../utils/sound-util.ts";

Deno.test("generateSoundId returns valid UUID", () => {
	const id = soundUtil.generateSoundId();
	assertExists(id);
	assertEquals(id.length, 36);
});

Deno.test("isValidSoundFile accepts mp3", () => {
	const result = soundUtil.isValidSoundFile("test.mp3", 1024);
	assertEquals(result.valid, true);
});

Deno.test("isValidSoundFile accepts wav", () => {
	const result = soundUtil.isValidSoundFile("test.wav", 1024);
	assertEquals(result.valid, true);
});

Deno.test("isValidSoundFile accepts ogg", () => {
	const result = soundUtil.isValidSoundFile("test.ogg", 1024);
	assertEquals(result.valid, true);
});

Deno.test("isValidSoundFile accepts flac", () => {
	const result = soundUtil.isValidSoundFile("test.flac", 1024);
	assertEquals(result.valid, true);
});

Deno.test("isValidSoundFile accepts m4a", () => {
	const result = soundUtil.isValidSoundFile("test.m4a", 1024);
	assertEquals(result.valid, true);
});

Deno.test("isValidSoundFile rejects invalid extension", () => {
	const result = soundUtil.isValidSoundFile("test.exe", 1024);
	assertEquals(result.valid, false);
	assertExists(result.error);
});

Deno.test("isValidSoundFile rejects file too large", () => {
	const result = soundUtil.isValidSoundFile("test.mp3", 20 * 1024 * 1024);
	assertEquals(result.valid, false);
	assertExists(result.error);
});

Deno.test("getSoundPath returns correct path", () => {
	const guildId = "123456";
	const filename = "sound.mp3";
	const path = soundUtil.getSoundPath(guildId, filename);
	assertEquals(path.includes("data/sounds/123456/sound.mp3"), true);
});

Deno.test("getSoundDir returns correct directory", () => {
	const guildId = "123456";
	const dir = soundUtil.getSoundDir(guildId);
	assertEquals(dir.includes("data/sounds/123456"), true);
});

Deno.test("createSoundClip creates valid object", () => {
	const clip = soundUtil.createSoundClip(
		"test-id",
		"My Sound",
		"sound.mp3",
		"user123",
		1024,
	);
	assertEquals(clip.id, "test-id");
	assertEquals(clip.name, "My Sound");
	assertEquals(clip.filename, "sound.mp3");
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

Deno.test("fileExists returns false for non-existent file", async () => {
	const exists = await soundUtil.fileExists("/nonexistent/path/file.mp3");
	assertEquals(exists, false);
});
