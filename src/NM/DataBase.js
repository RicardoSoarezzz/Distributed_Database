const axios = require("axios");
const SystemLog = require("../DN/SystemLog");

const logFilePath = "C:/Users/geral/SD_GRUPO4/log/server.log";
const errorFilePath = "C:/Users/geral/SD_GRUPO4/log/error.log";

const systemLogs = new SystemLog(logFilePath);
const errorLogs = new SystemLog(errorFilePath);

class DataBase {
	constructor() {
		this.data = {};
	}

	// Create operation
	create(key, value) {
		if (!this.data[key]) {
			this.data[key] = value;
			return { data: { key, value }, error: 0 };
		} else {
			errorLogs.error("EDB001 | Key already exists");
			return {
				data: 0,
				error: {
					code: "EDB001",
					errno: 1,
					message: "Key already exists",
				},
			};
		}
	}

	// Read operation
	read(key) {
		if (this.data[key]) {
			return { data: { key, value: this.data[key] }, error: 0 };
		} else {
			errorLogs.error("EDB002 | Key not found");
			return {
				data: 0,
				error: {
					code: "EDB002",
					errno: 2,
					message: "Key not found",
				},
			};
		}
	}

	// Update operation
	update(key, newValue) {
		if (this.data[key]) {
			this.data[key] = newValue;
			return { data: { key, value: newValue }, error: 0 };
		} else {
			errorLogs.error("EDB003 | Key not found");
			return {
				data: 0,
				error: {
					code: "EDB003",
					errno: 3,
					message: "Key not found",
				},
			};
		}
	}

	// Delete operation
	delete(key) {
		if (this.data[key]) {
			delete this.data[key];

			return { data: { key }, error: 0 };
		} else {
			errorLogs.error("EDB004 | Key not found");
			return {
				data: 0,
				error: {
					code: "EDB004",
					errno: 4,
					message: "Key not found",
				},
			};
		}
	}
}

module.exports = DataBase;
