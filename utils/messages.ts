const GIVE_PHRASES = [
	"Finally passed it on, huh? Couldn't handle the heat.",
	"Look at this dummy, stuck with the amulet now.",
	"Congratulations, you've inherited the burden. Try not to cry.",
	"Tag! You're it. Don't mess it up like the last one.",
	"The curse is yours now. Good luck, you'll need it.",
	"Welcome to the club, chump. We have jackets. (You don't get one).",
	"Well, well, well... look who got stuck with the amulet.",
	"Nice job, you played yourself. The amulet is now yours.",
	"Here you go! Don't say I didn't warn you.",
	"Oopsie! The amulet chose you. Fate is cruel, isn't it?",
];

const SELF_GIVE_PHRASES = [
	"You can't give it to yourself, are you stupid?",
	"Nice try, but you can't pass it to yourself.",
	"Did you really just try to give it to yourself? That's not how this works.",
	"Seriously? You can't tag yourself. Try reading the instructions.",
	"Oh dear... you can't be both the giver and the receiver. That's just sad.",
];

const TIMEOUT_PHRASES = [
	"Wow, you held onto that thing for so long I almost forgot about you. Almost.",
	"Time's up, slowpoke. The amulet gets bored easily.",
	"Couldn't even find someone to tag? That's just sad.",
	"The amulet has abandoned you out of sheer boredom. Pathetic.",
	"You were so bad at this game the amulet rage-quit.",
	"Six hours? Really? That's barely enough time to learn nothing.",
	"The amulet got tired of looking at you. Can't blame it.",
	"Finally! I was starting to think you'd never let go.",
];

const RESET_PHRASES = [
	"A moderator has spoken! The amulet is free for the next victim.",
	"POOF! Amulet reset. Someone's been a bad little player.",
	"Moderator intervention! The game has been... rebooted.",
	"The amulet has been liberated from its mortal tether. Go forth and struggle!",
	"Someone hit the big red button. Amulet is now up for grabs!",
	"Reset! Because apparently nobody could handle the pressure.",
];

const NEW_LEADER_PHRASES = [
	"Unbelievable. A new loser has taken the top spot on the leaderboard.",
	"Alert the media! We have a new champion of holding things for too long.",
	"A new king has been crowned! A king of fools, but a king nonetheless.",
	"The throne has been usurped! Let's see how long this reign of incompetence lasts.",
	"Look who's on top now! Won't last long though...",
	"Oh great, a new leader. Let's see how quickly they fall.",
];

const LOST_LEAD_PHRASES = [
	"Downgraded to second place! The view from below is lovely.",
	"Someone knocked you off your throne. Better luck next time... probably not.",
	"NOT the leader anymore! How does it feel to be merely mediocre?",
	"You held the top spot for so long! Just kidding, not long enough.",
	"Back to the shadows, former glory. You had your moment.",
	"Et tu, bracket? Someone took your spot. Tragic.",
];

function randomPhrase(phrases: string[]): string {
	return phrases[Math.floor(Math.random() * phrases.length)];
}

export const messages = {
	give: () => randomPhrase(GIVE_PHRASES),
	selfGive: () => randomPhrase(SELF_GIVE_PHRASES),
	timeout: () => randomPhrase(TIMEOUT_PHRASES),
	reset: () => randomPhrase(RESET_PHRASES),
	newLeader: () => randomPhrase(NEW_LEADER_PHRASES),
	lostLead: () => randomPhrase(LOST_LEAD_PHRASES),
};
