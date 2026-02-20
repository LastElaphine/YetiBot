import { assertEquals, assertExists, assertGreater } from "@std/assert";
import { createTestUserProfile } from "../fixtures/database.ts";

Deno.test("UserProfile has passesGiven stat", () => {
	const user = createTestUserProfile();
	assertExists(user.stats.passesGiven);
	assertEquals(typeof user.stats.passesGiven, "number");
});

Deno.test("UserProfile has passesReceived stat", () => {
	const user = createTestUserProfile();
	assertExists(user.stats.passesReceived);
	assertEquals(typeof user.stats.passesReceived, "number");
});

Deno.test("UserProfile has longestHoldTimeMs stat", () => {
	const user = createTestUserProfile();
	assertExists(user.stats.longestHoldTimeMs);
	assertEquals(typeof user.stats.longestHoldTimeMs, "number");
});

Deno.test("UserProfile new stats are initialized to zero", () => {
	const user = createTestUserProfile({
		stats: {
			amuletHeldCount: 0,
			amuletHeldTimeMs: 0,
			longestHoldTimeMs: 0,
			passesGiven: 0,
			passesReceived: 0,
			gamesPlayed: 0,
			commandUses: new Map(),
		},
	});
	assertEquals(user.stats.passesGiven, 0);
	assertEquals(user.stats.passesReceived, 0);
	assertEquals(user.stats.longestHoldTimeMs, 0);
});

Deno.test("UserProfile longestHoldTimeMs tracks longest single hold", () => {
	const user = createTestUserProfile({
		stats: {
			amuletHeldCount: 5,
			amuletHeldTimeMs: 300000,
			longestHoldTimeMs: 120000,
			passesGiven: 3,
			passesReceived: 5,
			gamesPlayed: 10,
			commandUses: new Map(),
		},
	});
	assertEquals(user.stats.longestHoldTimeMs, 120000);
	assertGreater(user.stats.longestHoldTimeMs, 0);
});

Deno.test("UserProfile passesGiven tracks passes to others", () => {
	const user = createTestUserProfile({
		stats: {
			amuletHeldCount: 5,
			amuletHeldTimeMs: 300000,
			longestHoldTimeMs: 120000,
			passesGiven: 3,
			passesReceived: 5,
			gamesPlayed: 10,
			commandUses: new Map(),
		},
	});
	assertEquals(user.stats.passesGiven, 3);
});

Deno.test("UserProfile passesReceived tracks received passes", () => {
	const user = createTestUserProfile({
		stats: {
			amuletHeldCount: 5,
			amuletHeldTimeMs: 300000,
			longestHoldTimeMs: 120000,
			passesGiven: 3,
			passesReceived: 5,
			gamesPlayed: 10,
			commandUses: new Map(),
		},
	});
	assertEquals(user.stats.passesReceived, 5);
});
