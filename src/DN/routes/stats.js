const express = require("express");
const router = express.Router();
const stats_operations = require("C:\\Users\\geral\\SD_GRUPO4\\src\\RP\\stats.js");

router.get("/", function (req, res) {
	const currentStats = stats_operations.getStats();
	res.json(currentStats);
});

router.use((req, res, next) => {
	const method = req.method.toLowerCase();
	if (["post", "put", "patch", "delete"].includes(method)) {
		stats_operations.updateStats(method);
	}
	next();
});

module.exports = router;
