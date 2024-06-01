const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const systemLoger = require("../DN/SystemLog");
const DataBase = require("../NM/DataBase.js");
const { callcfg, electMaster, getStatus } = require("../RP/myUtils");

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;

const logFilePath = "C:/Users/geral/SD_GRUPO4/log/server.log";
const errorFilePath = "C:/Users/geral/SD_GRUPO4/log/error.log";
const masterFilePath = "C:/Users/geral/SD_GRUPO4/log/master.log";

const systemLogs = new systemLoger(logFilePath);
const errorLogs = new systemLoger(errorFilePath);
const masterLogs = new systemLoger(masterFilePath);
const startTime = new Date();

let masterNode = null;
let masterPort = null;

const db = new DataBase();

// Middleware to check if the server is master
const checkIfMaster = (req, res, next) => {
	if (req.socket.localPort === masterPort) {
		next();
	} else {
		res
			.status(403)
			.json({ error: "Only the master can perform this operation" });
	}
};

// Start the server and initialize the system
app.listen(PORT, () => {
	if (!masterNode) {
		const cfg = callcfg();
		masterNode = electMaster(cfg);
		masterPort = masterNode.port;
	}
	console.log(`Server started on port ${PORT}`);
	try {
		systemLogs.info(`Server started on port ${PORT}`);
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
        <p>Ricardo Soares | Miguel Moreira</p>
        <button style="margin: 10px; padding: 10px 20px; background-color: #00C0A0; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;" onclick="window.location.href='/stats'">Check Status (/status)</button>
        <button style="margin: 10px; padding: 10px 20px; background-color: #00C0A0; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;" onclick="window.location.href='/master_node'">Check Master Node (/master_node)</button>
        <button style="margin: 10px; padding: 10px 20px; background-color: red; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;" onclick="window.location.href='/setMaster'">Elect new Master (/setMaster)</button>
        </div>
    `);
});

app.post("/admin/loglevel", (req, res) => {
	const newLogLevel = req.body.level;
	systemLogs.info(newLogLevel);
	res.json({ loglevel: newLogLevel });
});

app.get("/stats", async (req, res) => {
	try {
		const status = await getStatus(startTime);
		systemLogs.info(status);
		res.json(status);
	} catch (error) {
		errorLogs.error(error.message);
		res.status(500).json({ error: "Error getting system status" });
	}
});

// Define the route handler for /setMaster endpoint
app.get("/setMaster", async (req, res) => {
	try {
		const cfg = callcfg();
		masterNode = electMaster(cfg); // Update the masterNode variable
		masterPort = masterNode.port; // Update the masterPort variable
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

// DB endpoints with middleware to check if the server is master
app.post("/db/c", checkIfMaster, (req, res) => {
	const { key, value } = req.body;
	const result = db.create(key, value);
	res.json(result);
});

app.put("/db/u", checkIfMaster, (req, res) => {
	const { key, value } = req.body;
	const result = db.update(key, value);
	res.json(result);
});

app.delete("/db/d", checkIfMaster, (req, res) => {
	const { key } = req.body;
	const result = db.delete(key);
	res.json(result);
});

app.get("/db/r", (req, res) => {
	const { key } = req.query;
	const result = db.read(key);
	res.json(result);
});

app.get("/stop", (req, res) => {
	res.json({ message: "Stopping DN" });
	process.exit(0);
});

// Start each node's server
const startNodeServers = () => {
	const cfg = callcfg();
	cfg.DNs.forEach((dn) => {
		dn.servers.forEach((server) => {
			app.use(bodyParser.json());
			if (server.port == 3000) {
				masterPort = server.port;
			}
			app.post("/maintenance", (req, res) => {
				// Implement maintenance logic for each node server
				res.json({ message: "Maintenance data synchronized" });
			});

			app.listen(server.port, () => {
				console.log(
					`Node server ${server.name} started on port ${server.port}`
				);
			});
		});
	});
};

// Call the function to start node servers
startNodeServers();

module.exports = app;
