import { Group } from '../../rules/interface';

const GroupResolver = {
  Query: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    groups: async (_: unknown, { id }: { id: string }): Promise<[Group]> => {
      const groupIds = Object.keys(globalThis.socketInstance.groups);
      return groupIds.map((groupId) => {
        return { id: groupId };
      }) as [Group];
    },
  },
};

export default GroupResolver;
