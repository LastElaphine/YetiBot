class Logger {
	private format(level: string, msg: string, args: unknown[]): string {
		const context: Record<string, unknown> = {};
		for (const arg of args) {
			if (arg && typeof arg === "object") {
				Object.assign(context, arg as Record<string, unknown>);
			}
		}
		return JSON.stringify({
			timestamp: new Date().toISOString(),
			level,
			logger: "default",
			message: msg,
			...context,
		});
	}

	debug(msg: string, ...args: unknown[]): void {
		console.log(this.format("DEBUG", msg, args));
	}

	info(msg: string, ...args: unknown[]): void {
		console.log(this.format("INFO", msg, args));
	}

	warn(msg: string, ...args: unknown[]): void {
		console.warn(this.format("WARN", msg, args));
	}

	error(msg: string, ...args: unknown[]): void {
		console.error(this.format("ERROR", msg, args));
	}
}

export const logger = new Logger();
