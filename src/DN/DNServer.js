const express = require("express");
const bodyParser = require("body-parser");
const SystemLog = require("./SystemLog");
const { callcfg, electMaster, logger } = require("../RP/myUtils");

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const logFilePath = `C:\\Users\\geral\\SD_GRUPO4\\log\\combined.log`;
const systemLog = new SystemLog(logFilePath);

let isMaster = false;
let db = {};

// Common endpoints
app.get("/status", (req, res) => {
	res.json({ status: "DN is running", master: isMaster });
});

app.get("/stats", (req, res) => {
	res.json({ stats: "Statistics data" });
});

app.post("/admin/loglevel", (req, res) => {
	const level = req.body.level;
	logger.level = level;
	res.json({ loglevel: logger.level });
});

// DB endpoints
app.post("/db/c", (req, res) => {
	const { key, value } = req.body;
	db[key] = value;
	res.json({ message: "Created", key, value });
});

app.get("/db/r", (req, res) => {
	const { key } = req.query;
	const value = db[key];
	if (value) {
		res.json({ key, value });
	} else {
		res.status(404).json({ error: "Key not found" });
	}
});

app.put("/db/u", (req, res) => {
	const { key, value } = req.body;
	if (db[key]) {
		db[key] = value;
		res.json({ message: "Updated", key, value });
	} else {
		res.status(404).json({ error: "Key not found" });
	}
});

app.delete("/db/d", (req, res) => {
	const { key } = req.body;
	if (db[key]) {
		delete db[key];
		res.json({ message: "Deleted", key });
	} else {
		res.status(404).json({ error: "Key not found" });
	}
});

app.get("/stop", (req, res) => {
	res.json({ message: "Stopping DN" });
	process.exit(0);
});

// DN-specific endpoints
app.post("/election", (req, res) => {
	const cfg = callcfg();
	const master = electMaster(cfg);
	if (master.port === PORT) {
		isMaster = true;
	}
	res.json(master);
});

app.post("/maintenance", (req, res) => {
	// Implement maintenance logic
	res.json({ message: "Maintenance data synchronized" });
});

// Start the server
app.listen(PORT, () => {
	systemLog.addEntry(`DN server started on port ${PORT}`);
	console.log(`DN server started on port ${PORT}`);
});

module.exports = app;
