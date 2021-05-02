import { User, Settings } from '../../rules/interface';

interface Group {
  id: string;
  users?: [User];
  settings: Settings;
}

const GroupResolver = {
  Query: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    groups: async (_: unknown, { id }: { id: string }): Promise<[Group]> => {
      if (id && id.length > 0 && !globalThis.socketInstance.groups[id]) {
        throw new Error('Invalid GroupId or not exist in list.');
      }
      const groupIds =
        id && id.length > 0 && globalThis.socketInstance.groups[id]
          ? [id]
          : Object.keys(globalThis.socketInstance.groups);

      return groupIds.map((groupId) => {
        const { users, settings } = globalThis.socketInstance.groups[groupId];
        return { id: groupId, users: Object.values(users), settings };
      }) as [Group];
    },
  },
};

export default GroupResolver;
