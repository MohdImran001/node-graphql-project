//TYPE-DEFINITIONS
const { buildSchema } = require('graphql');

module.exports = buildSchema(`
	type Post {
		_id: ID!
		title: String!
		content: String!
		imageUrl: String!
		creator: User!
		createdAt: String!
		updatedAt: String!
	}

	type User {
		_id: ID!
		email: String!
		password: String!
		name: String!
		status: String!
		posts: [Post!]!
	}

	input userInputData {
		email: String!
		password: String!
		name: String!
	}

	input postInputData {
		title: String!
		content: String!
		imageUrl: String!
	}

	type AuthData {
		token: String!
		userId: String!
	}

	type RootQuery {
		login(email: String!, password: String!): AuthData!
	}

	type RootMutation {
		createUser(userInput: userInputData): User!
		createPost(postInput: postInputData): Post!
	}

	schema {
		query: RootQuery
		mutation: RootMutation
	}
`);