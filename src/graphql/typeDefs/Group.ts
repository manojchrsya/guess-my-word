import { gql } from 'mercurius-codegen';

const GroupSchema = gql`
  type Group {
    hello(name: String): String
  }
`;

export default GroupSchema;
