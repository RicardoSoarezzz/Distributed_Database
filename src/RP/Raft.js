const systemLoger = require("../DN/SystemLog");

const STATES = {
	FOLLOWER: "Follower",
	CANDIDATE: "Candidate",
	LEADER: "Leader",
};

const logFilePath = "C:/Users/geral/SD_GRUPO4/log/server.log";
const logs = new systemLoger(logFilePath);

const allServers = {};
class Server {
	constructor(name, id, port) {
		this.name = name;
		this.id = id;
		this.state = STATES.FOLLOWER;
		this.currentTerm = 0;
		this.votedFor = null;
		this.votesReceived = 0;
		this.log = null;
		this.port = port;

		allServers[id] = this;
	}

	startElection() {
		if (this.state !== STATES.LEADER) {
			console.log(`Server ${this.name} starting election...`);
			this.state = STATES.CANDIDATE;
			this.currentTerm++;
			this.votedFor = this.id;
			this.log = logs.addEntry(
				`Server ${this.name} started an election`,
				"info"
			);
			return this.requestVotes();
		}
		return null;
	}

	requestVotes() {
		console.log(`Server ${this.name} requesting votes...`);
		servers.forEach((server) => {
			if (server.id !== this.id) {
				const random = Math.random();
				if (random > 0.5) {
					const voteGranted = server.receiveVoteRequest(
						this.currentTerm,
						this.id
					);
					if (voteGranted) {
						this.votesReceived++;
					}
				} else {
					this.votesReceived--;
				}
			}
		});
		this.log =
			this.log +
			logs.addEntry(`Server ${this.name} got: ${this.votesReceived} votes`);
		return this.votesReceived;
	}

	receiveVoteRequest(term, candidateId) {
		if (term > this.currentTerm) {
			this.state = STATES.FOLLOWER;
			this.currentTerm = term;
			this.votedFor = null;
		}
		if (
			(this.votedFor === null || this.votedFor === candidateId) &&
			term === this.currentTerm
		) {
			console.log(`Server ${this.name} voted for`);
			this.votedFor = candidateId;
			return true;
		}
		return false;
	}
}

let servers = [];

function electMaster(cfg) {
	console.log("\nElecting master using Raft consensus algorithm:");

	cfg.DNs.forEach((DN) => {
		DN.servers.forEach((server) => {
			servers.push(new Server(server.name, server.id, server.port));
		});
	});

	let highestVotes = 0;
	let electedLeader = null;

	servers.forEach((server) => {
		console.log("\n", server.name);
		const votesReceived = server.startElection();
		if (votesReceived > highestVotes) {
			highestVotes = votesReceived;
			electedLeader = server;
		}
	});

	if (electedLeader === null) {
		electedLeader = servers[0];
	}

	electedLeader.state = STATES.LEADER;
	console.log("\n\nElected leader:", electedLeader.name);
	return electedLeader;
}

module.exports = {
	electMaster,
	allServers,
};
