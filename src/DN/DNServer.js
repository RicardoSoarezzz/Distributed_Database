const axios = require("axios");
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const SystemLog = require("./SystemLog");
const DataBase = require("../NM/DataBase.js");
const dbPath = "C:/Users/geral/SD_GRUPO4/DB-data";
const { callcfg, electMaster, logger } = require("../RP/myUtils");
const logFilePath = `C:/Users/geral/SD_GRUPO4/log/combined.log`;

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 2000;

const systemLog = new SystemLog(logFilePath);
const db = new DataBase(dbPath);

let isMaster = false;
master = null;

const checkIfMaster = (req, res, next) => {
	next();
};

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
	logger.level = newLogLevel;
	res.json({ loglevel: logger.level });
});

app.post("/db/c", checkIfMaster, (req, res) => {
	const { key, Name } = req.body;
	//console.log(req.body);
	const result = db.create(key, Name);
	res.json(result);
});

app.put("/db/u", checkIfMaster, (req, res) => {
	const { key, Name } = req.body;
	const result = db.update(key, Name);
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

app.post("/election", (req, res) => {
	const cfg = callcfg();
	const master = electMaster(cfg);
	if (master.port === PORT) {
		isMaster = true;
	}
	res.json(master);
});

app.get("/maintenance", (req, res) => {
	const datanodes = fs.readdirSync(dbPath).filter((dn) => dn.startsWith("dn"));

	datanodes.forEach((dn) => {
		const servers = fs
			.readdirSync(path.join(dbPath, dn))
			.filter((s) => s.startsWith("s"));

		const firstServerData = {};
		servers.forEach((server) => {
			const serverKeys = fs.readdirSync(path.join(dbPath, dn, server));
			serverKeys.forEach((key) => {
				const value = fs.readFileSync(
					path.join(dbPath, dn, server, key),
					"utf-8"
				);
				if (!firstServerData[key]) {
					firstServerData[key] = value;
				}
			});
		});

		servers.forEach((server) => {
			const serverKeys = fs.readdirSync(path.join(dbPath, dn, server));
			Object.keys(firstServerData).forEach((key) => {
				if (!serverKeys.includes(key)) {
					fs.writeFileSync(
						path.join(dbPath, dn, server, key),
						firstServerData[key]
					);
				}
			});
		});
	});

	res.json({ message: "Maintenance data synchronized" });
});

app.listen(PORT, () => {
	systemLog.addEntry(`DN server started on port ${PORT}`);
	console.log(`DN server started on port ${PORT}`);
});

// Interface routes
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/index.html");
});

// Interface route for handling form submission
app.post("/submit", async (req, res) => {
	const { action, key, Name } = req.body;

	try {
		let response;
		if (action === "create") {
			response = await axios.post(`http://localhost:${PORT}/db/c`, {
				key,
				Name,
			});
		} else if (action === "read") {
			response = await axios.get(`http://localhost:${PORT}/db/r?key=${key}`);
		} else if (action === "update") {
			response = await axios.put(`http://localhost:${PORT}/db/u`, {
				key,
				Name,
			});
		} else if (action === "delete") {
			response = await axios.delete(`http://localhost:${PORT}/db/d`, {
				data: { key },
			});
		}
		res.json(response.data);
	} catch (error) {
		//console.error(error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// Start each node's server
const startNodeServers = () => {
	const cfg = callcfg();
	cfg.DNs.forEach((dn) => {
		dn.servers.forEach((server) => {
			const nodeApp = express();
			nodeApp.use(bodyParser.json());
			nodeApp.post("/maintenance", (req, res) => {
				// Implement maintenance logic for each node server
				res.json({ message: "Maintenance data synchronized" });
			});

			nodeApp.listen(server.port, () => {
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
