import { assert, assertExists } from "@std/assert";
import { messages } from "../utils/messages.ts";

Deno.test("messages.give returns a string", () => {
	const phrase = messages.give();
	assertExists(phrase);
	assert(typeof phrase === "string");
	assert(phrase.length > 0);
});

Deno.test("messages.timeout returns a string", () => {
	const phrase = messages.timeout();
	assertExists(phrase);
	assert(typeof phrase === "string");
	assert(phrase.length > 0);
});

Deno.test("messages.reset returns a string", () => {
	const phrase = messages.reset();
	assertExists(phrase);
	assert(typeof phrase === "string");
	assert(phrase.length > 0);
});

Deno.test("messages.newLeader returns a string", () => {
	const phrase = messages.newLeader();
	assertExists(phrase);
	assert(typeof phrase === "string");
	assert(phrase.length > 0);
});

Deno.test("messages.lostLead returns a string", () => {
	const phrase = messages.lostLead();
	assertExists(phrase);
	assert(typeof phrase === "string");
	assert(phrase.length > 0);
});

Deno.test("messages.give returns different phrases on multiple calls", () => {
	const phrases = new Set<string>();
	for (let i = 0; i < 10; i++) {
		phrases.add(messages.give());
	}
	assert(phrases.size > 1, "Expected different phrases on multiple calls");
});

Deno.test("messages.timeout returns different phrases on multiple calls", () => {
	const phrases = new Set<string>();
	for (let i = 0; i < 10; i++) {
		phrases.add(messages.timeout());
	}
	assert(phrases.size > 1, "Expected different phrases on multiple calls");
});

Deno.test("messages.reset returns different phrases on multiple calls", () => {
	const phrases = new Set<string>();
	for (let i = 0; i < 10; i++) {
		phrases.add(messages.reset());
	}
	assert(phrases.size > 1, "Expected different phrases on multiple calls");
});
