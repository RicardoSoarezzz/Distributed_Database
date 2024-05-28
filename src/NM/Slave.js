const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3100;

let database = {};

app.use(bodyParser.json());

// Read
app.get("/db/r/:key", (req, res) => {
	const { key } = req.params;
	const value = database[key];
	if (value === undefined) {
		res.status(404).json({ error: "Key not found." });
	} else {
		res.json({ key, value });
	}
});

app.listen(PORT, () => {
	console.log(`Slave node running on port ${PORT}`);
});
