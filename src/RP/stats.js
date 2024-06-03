let stats = {
	create: 0,
	read: 0,
	update: 0,
	delete: 0,
};

function updateStats(operation) {
	stats[operation]++;
}

function getStats() {
	return { ...stats };
}

module.exports = {
	updateStats,
	getStats,
};
