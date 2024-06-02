const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

class DataBase {
	constructor(basePath) {
		this.basePath = basePath;
	}

	_getFilePath(key, dn, server) {
		return path.join(this.basePath, dn, server, key);
	}

	_getRandomElement(array) {
		return array[Math.floor(Math.random() * array.length)];
	}

	_generateHash(key) {
		return crypto.createHash("sha256").update(key).digest("hex");
	}

	create(key, value) {
		const datanodes = fs
			.readdirSync(this.basePath)
			.filter((dn) => dn.startsWith("dn"));
		const selectedDn = this._getRandomElement(datanodes);
		const servers = fs
			.readdirSync(path.join(this.basePath, selectedDn))
			.filter((s) => s.startsWith("s00"));
		const selectedServer = this._getRandomElement(servers);
		const hashKey = this._generateHash(key);
		const filePath = this._getFilePath(hashKey, selectedDn, selectedServer);

		if (fs.existsSync(filePath)) {
			return { error: "Key already exists" };
		}

		fs.writeFileSync(filePath, value);
		return {
			key: hashKey,
			value,
			datanode: selectedDn,
			server: selectedServer,
		};
	}

	read(key) {
		const datanodes = fs
			.readdirSync(this.basePath)
			.filter((dn) => dn.startsWith("dn"));
		for (let dn of datanodes) {
			const servers = fs
				.readdirSync(path.join(this.basePath, dn))
				.filter((s) => s.startsWith("s00"));
			for (let server of servers) {
				const filePath = this._getFilePath(key, dn, server);
				if (fs.existsSync(filePath)) {
					const value = fs.readFileSync(filePath, "utf8");
					return { value: value, datanode: dn };
				}
			}
		}
		return { error: "Key not found" };
	}

	update(key, value) {
		const datanodes = fs
			.readdirSync(this.basePath)
			.filter((dn) => dn.startsWith("dn"));
		for (let dn of datanodes) {
			const servers = fs
				.readdirSync(path.join(this.basePath, dn))
				.filter((s) => s.startsWith("s00"));
			for (let server of servers) {
				const filePath = this._getFilePath(key, dn, server);
				if (fs.existsSync(filePath)) {
					fs.writeFileSync(filePath, value);
					return { key, value, datanode: dn, server };
				}
			}
		}
		return { error: "Key not found" };
	}

	delete(key) {
		const datanodes = fs
			.readdirSync(this.basePath)
			.filter((dn) => dn.startsWith("dn"));
		for (let dn of datanodes) {
			const servers = fs
				.readdirSync(path.join(this.basePath, dn))
				.filter((s) => s.startsWith("s00"));
			for (let server of servers) {
				const filePath = this._getFilePath(key, dn, server);
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
					return { message: "Key deleted", datanode: dn, server };
				}
			}
		}
		return { error: "Key not found" };
	}
}

module.exports = DataBase;
