const express = require("express");
const bodyParser = require("body-parser");
const { callcfg, electMaster, getStatus } = require("./myUtils");
//const DN = require("../DN/DNServer.js");
const SystemLog = require("../DN/SystemLog");
const DataBase = require("../NM/DataBase.js");
const DN = require("../DN/DNServer.js");

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;
const logFilePath = "C:/Users/geral/SD_GRUPO4/log/server.log";
const errorFilePath = "C:/Users/geral/SD_GRUPO4/log/error.log";
const masterFilePath = "C:/Users/geral/SD_GRUPO4/log/master.log";
const systemLogs = new SystemLog(logFilePath);
const errorLogs = new SystemLog(errorFilePath);
const masterLogs = new SystemLog(masterFilePath);
const startTime = new Date();

const dbPath = "C:/Users/geral/SD_GRUPO4/src/DN/DNServer.js";
const db = new DataBase(dbPath);

let masterNode = null;
let masterPort = null;

const checkIfMaster = (req, res, next) => {
	if (req.socket.localPort === masterPort) {
		next();
	} else {
		res
			.status(403)
			.json({ error: "Only the master can perform this operation" });
	}
};

app.listen(PORT, () => {
	if (!masterNode) {
		const cfg = callcfg();
		masterNode = electMaster(cfg);
		masterPort = masterNode.port;
		DN.master = masterPort;
	}
	console.log(`Server started on port ${PORT}`);
	systemLogs.info(`Server started on port ${PORT}`);
});

app.get("/", (req, res) => {
	res.send(`
        <div style="text-align: center;">
        <br><br><br>
        <h1>Node.js - Distributed DB - Grupo 4</h1>
        <button onclick="window.location.href='/stat'">Check Status (/status)</button>
        <button onclick="window.location.href='/master_node'">Check Master Node (/master_node)</button>
        <button onclick="window.location.href='/set_master'">Elect new Master (/setMaster)</button>
        </div>
    `);
});

app.post("/admin/loglevel", (req, res) => {
	const newLogLevel = req.body.level;
	systemLogs.info(newLogLevel);
	res.json({ loglevel: newLogLevel });
});

app.get("/stat", async (req, res) => {
	try {
		const status = await getStatus(startTime);
		systemLogs.info(status);
		res.json(status);
	} catch (error) {
		errorLogs.error(error.message);
		res.status(500).json({ error: "Error getting system status" });
	}
});

app.get("/set_master", async (req, res) => {
	try {
		const cfg = callcfg();
		masterNode = electMaster(cfg);
		masterPort = masterNode.port;
		DN.master = masterPort;
		masterLogs.info(masterNode);
		res.json(masterNode);
	} catch (error) {
		errorLogs.error(error.message);
		res.status(500).json({ error: "Error getting master node information" });
	}
});

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
	res.json({ message: "Stopping Reverse Proxy" });
	process.exit(0);
});

module.exports = app;
