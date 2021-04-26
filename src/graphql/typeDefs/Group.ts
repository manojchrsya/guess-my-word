import { gql } from 'mercurius-codegen';

const GroupSchema = gql`
  type User {
    id: ID
    name: String!
    role: String!
    guessed: Boolean
    played: Boolean
    score: Int!
    groupId: String!
    socketId: String
    profilePic: String
  }

  type Group {
    id: ID
    users: [User!]!
  }

  type Query {
    groups(id: String): [Group]
  }
`;

export default GroupSchema;
