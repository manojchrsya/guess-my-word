import { gql } from 'mercurius-codegen';

const QuerySchema = gql`
  type Query {
    add(x: Int, y: Int): Int
  }
`;

export default QuerySchema;
