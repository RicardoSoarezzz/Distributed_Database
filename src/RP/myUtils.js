const axios = require("axios");
const winston = require("winston");
const path = require("path");
const fs = require("fs");
const raft = require("./Raft");

masterNode = null;

// Function to load the configuration from the JSON file with the nodes architecture.
function callcfg() {
	try {
		const configFile = fs.readFileSync("./etc/configure.json", "utf8");
		const cfg = JSON.parse(configFile);
		return cfg;
	} catch (error) {
		process.exit(1);
	}
}

// Function to elect the masters and return the elected master node.
function electMaster(cfg) {
	masterNode = raft.electMaster(cfg);
	return masterNode;
}

// Function to get system status
function getStatus(startTime) {
	const uptime = Math.floor((Date.now() - startTime) / 1000); // Calculate uptime in seconds
	const status = {
		status: "OK",
		uptime: uptime,
	};
	return status;
}

// Exporting functions and logger for use in other files
module.exports = {
	callcfg,
	electMaster,
	getStatus,
};
