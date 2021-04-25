import { gql } from 'mercurius-codegen';

const GroupSchema = gql`
  type Query {
    hello(name: String): String
  }
`;

export default GroupSchema;
