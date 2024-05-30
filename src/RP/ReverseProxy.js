const request = require("request");
const express = require("express");
const path = require("path");
const systemLoger = require("../DN/SystemLog");
const app = express();
const PORT = 4000;

masterNode = null;

const { getStatus, callcfg, electMaster } = require("./myUtils");
const e = require("express");

// Define the path for the log folder and log file
const logFilePath = "C:/Users/geral/SD_GRUPO4/log/server.log";
const errorFilePath = "C:/Users/geral/SD_GRUPO4/log/error.log";
const masterFilePath = "C:/Users/geral/SD_GRUPO4/log/master.log";

// Create a new SystemLog instance
const systemLogs = new systemLoger(logFilePath);
const errorLogs = new systemLoger(errorFilePath);
const masterLogs = new systemLoger(masterFilePath);
const startTime = new Date();

// Start the server and initialize the system
app.listen(PORT, () => {
	if (!masterNode) {
		const cfg = callcfg();
		masterNode = electMaster(cfg);
	}
	console.log(`Server started on port ${PORT}`);
	try {
		systemLogs.info(`Server started on port ${PORT}`);
		callcfg.start;
	} catch (error) {
		errorLogs.error(error.message);
	}
});

// Define a route to handle root requests
app.get("/", (req, res) => {
	res.send(`
	<div style="text-align: center;">
	<br><br><br>
	<h1>Node.js - Distributed DB - Grupo 4</h1>
	<h2>Reverse Proxy</h2>
	<p>Ricardo Soares | Miguel Moreira</p>
	<button style="margin: 10px; padding: 10px 20px; background-color: #00C0A0; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;" onclick="window.location.href='/status'">Check Status (/status)</button>
	<button style="margin: 10px; padding: 10px 20px; background-color: #00C0A0; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;" onclick="window.location.href='/master_node'">Check Master Node (/master_node)</button>
	<button style="margin: 10px; padding: 10px 20px; background-color: red; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;" onclick="window.location.href='/setMaster'">Elect new Master (/setMaster)</button>
</div>
    `);
});

app.get("/status", async (req, res) => {
	try {
		const status = await getStatus(startTime);
		systemLogs.info(status);
		res.json(status);
	} catch (error) {
		// Handle errors and log them
		errorLogs.error(error.message);
		res.status(500).json({ error: "Error getting system status" });
	}
});

// Define the route handler for /setMaster endpoint
app.get("/setMaster", async (req, res) => {
	try {
		const cfg = callcfg();
		masterNode = electMaster(cfg); // Update the masterNode variable
		masterLogs.info(masterNode);
		res.json(masterNode);
	} catch (error) {
		errorLogs.error(error.message);
		res.status(500).json({ error: "Error getting master node information" });
	}
});

// Define the route handler for /master_node endpoint
app.get("/master_node", (req, res) => {
	try {
		if (masterNode) {
			res.json(masterNode);
		} else {
			res.status(404).json({ error: "Master node not elected yet" });
		}
	} catch (error) {
		errorLogs.error(error.message);
		res.status(500).json({ error: "Error getting master node information" });
	}
});
