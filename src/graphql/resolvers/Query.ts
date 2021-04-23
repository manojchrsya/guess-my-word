const QueryResolver = {
  Query: {
    add: async (_: unknown, { x, y }: { x: number; y: number }): Promise<number> => x + y,
  },
};

export default QueryResolver;
