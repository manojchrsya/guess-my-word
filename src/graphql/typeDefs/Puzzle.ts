import { gql } from 'mercurius-codegen';

const PuzzleSchema = gql`
  type Query {
    puzzles(limit: Int = 1): [Puzzle!]!
  }
  type Puzzle {
    title: String!
    description: String
  }
`;

export default PuzzleSchema;
