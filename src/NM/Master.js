const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

let database = {};

app.use(bodyParser.json());

// Create
app.post("/db/c", (req, res) => {
	const { key, value } = req.body;
	database[key] = value;
	res.json({ message: "Key-value pair created successfully." });
});

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

// Update
app.put("/db/u/:key", (req, res) => {
	const { key } = req.params;
	const { value } = req.body;
	if (database[key] === undefined) {
		res.status(404).json({ error: "Key not found." });
	} else {
		database[key] = value;
		res.json({ message: "Key-value pair updated successfully." });
	}
});

// Delete
app.delete("/db/d/:key", (req, res) => {
	const { key } = req.params;
	if (database[key] === undefined) {
		res.status(404).json({ error: "Key not found." });
	} else {
		delete database[key];
		res.json({ message: "Key deleted successfully." });
	}
});

app.listen(PORT, () => {
	console.log(`Master node running on port ${PORT}`);
});
