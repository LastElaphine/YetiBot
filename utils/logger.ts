import type { LogRecord } from "@std/log";
import * as log from "@std/log";

const JSON_FORMATTER = (record: LogRecord): string => {
	const context: Record<string, unknown> = {};
	for (const arg of record.args) {
		if (arg && typeof arg === "object") {
			Object.assign(context, arg);
		}
	}
	return `${JSON.stringify({
		timestamp: record.datetime.toISOString(),
		level: record.levelName,
		logger: record.loggerName,
		message: record.msg,
		...context,
	})}\n`;
};

await log.setup({
	handlers: {
		console: new log.ConsoleHandler("DEBUG", {
			formatter: JSON_FORMATTER,
		}),
	},
	loggers: {
		default: {
			level: "DEBUG",
			handlers: ["console"],
		},
	},
});

export const logger = {
	debug: (msg: string, ...args: unknown[]) => log.debug(msg, ...args),
	info: (msg: string, ...args: unknown[]) => log.info(msg, ...args),
	warn: (msg: string, ...args: unknown[]) => log.warn(msg, ...args),
	error: (msg: string, ...args: unknown[]) => log.error(msg, ...args),
};

export { log };
