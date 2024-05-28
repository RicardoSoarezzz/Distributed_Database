// Define table schema
const UsersSchema = {
	username: { type: String, required: true },
	password: { type: String, required: true },
};

module.exports = UsersSchema;
