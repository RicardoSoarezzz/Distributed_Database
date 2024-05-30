const express = require("express");
const bodyParser = require("body-parser");
const SystemLog = require("./SystemLog");
const DataBase = require("../NM/DataBase.js");
const { callcfg, electMaster, logger } = require("../RP/myUtils");

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 2000;
const logFilePath = `C:/Users/geral/SD_GRUPO4/log/combined.log`;
const systemLog = new SystemLog(logFilePath);
const db = new DataBase();

let masterPort = 3000;

// Middleware to check if the server is master
const checkIfMaster = (req, res, next) => {
	if (req.socket.localPort === masterPort) {
		next();
	} else {
		res.status(403).json({ error: "Only master can perform this operation" });
	}
};

// Common endpoints
app.get("/status", (req, res) => {
	res.json({ status: "DN is running", master: isMaster });
});

app.get("/stats", (req, res) => {
	const stats = {
		uptime: process.uptime(),
		message: "DN stats",
		timestamp: Date.now(),
	};
	res.json(stats);
});

app.post("/admin/loglevel", (req, res) => {
	const newLogLevel = req.body.level;
	systemLog.info(newLogLevel);
	res.json({ loglevel: newLogLevel });
});

app.post("/admin/loglevel", (req, res) => {
	const level = req.body.level;
	logger.level = level;
	res.json({ loglevel: logger.level });
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
