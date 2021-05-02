import { gql } from 'mercurius-codegen';

const GroupSchema = gql`
  enum GameStatus {
    start
    stop
    finish
  }

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

  type Settings {
    rounds: Int!
    currentRound: Int!
    timings: Int
    puzzle: String
    userId: String
    playerId: String
    status: GameStatus!
  }

  type Group {
    id: ID
    users: [User!]
    settings: Settings
  }

  type Query {
    groups(id: String): [Group]
  }
`;

export default GroupSchema;
