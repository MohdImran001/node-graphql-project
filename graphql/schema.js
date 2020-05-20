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

	type PostData {
		posts_array: [Post!]!
		totalPosts: Int!
	}

	type RootQuery {
		login(email: String!, password: String!): AuthData!
		getPosts(page: Int): PostData!
		post(id: ID!): Post!
		user: User!
	}

	type RootMutation {
		createUser(userInput: userInputData): User!
		createPost(postInput: postInputData): Post!
		updatePost(id: ID!, postInput: postInputData!): Post!
		deletePost(id: ID!): Boolean!
		updateStatus(status: String!): User!
	}

	schema {
		query: RootQuery
		mutation: RootMutation
	}
`);

