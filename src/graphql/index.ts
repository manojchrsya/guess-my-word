import { makeExecutableSchema } from '@graphql-tools/schema';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';

import schema from './typeDefs';
import resolvers from './resolvers';

const ExecutableSchema = makeExecutableSchema({
  // Merge type definitions from different sources
  typeDefs: mergeTypeDefs(schema),
  // Merge resolvers from different sources
  resolvers: mergeResolvers([...resolvers]),
});

export default ExecutableSchema;
