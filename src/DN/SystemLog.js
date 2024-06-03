const winston = require("winston");

/**
 * Represents a system log.
 */
class SystemLog {
	/**
	 * Constructs a new SystemLog.
	 * @param {string} logFilePath - Path to the log file.
	 */
	constructor(logFilePath) {
		this.logger = winston.createLogger({
			format: winston.format.combine(
				winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
				winston.format.errors({ stack: true }),
				winston.format.splat(),
				winston.format.json()
			),
			transports: [
				new winston.transports.File({ filename: logFilePath, level: "info" }),
				new winston.transports.Console({
					format: winston.format.combine(
						winston.format.colorize(),
						winston.format.simple()
					),
					level: "debug",
				}),
			],
		});
	}

	/**
	 * Adds a log entry to the system log.
	 * @param {string} message - Log message to be added.
	 * @param {string} level - Log level (default is 'info').
	 */
	addEntry(message, level = "info") {
		this.logger.log({ level, message });
	}

	info(message) {
		this.addEntry(message, "info");
	}

	master(message) {
		this.addEntry(message, "master");
	}

	error(message) {
		this.addEntry(message, "error");
	}
}

module.exports = SystemLog;
