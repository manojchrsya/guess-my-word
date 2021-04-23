const GroupResolver = {
  Group: {
    hello: async (_: unknown, data: { name: string }): Promise<string> =>
      `Welcome to graphql ${data.name}`,
  },
};

export default GroupResolver;
