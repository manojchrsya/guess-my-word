export interface Group {
  id: string;
}
export interface User {
  id: string;
  name: string;
}
export default class Socket {
  private groups = {} as Group;
  private users: User[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(socket: any) {
    // eslint-disable-next-line no-console
    this.addGroup(socket);
    // eslint-disable-next-line
    console.log(`socket connected ${socket.id}`);
  }

  getUniqId(): string {
    return Math.random().toString(36).substring(2);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addGroup(socket: any) {
    socket.on('create group', async (data: User) => {
      const groupId = this.getUniqId();
      this.groups[groupId] = {};
      this.groups[groupId][data.id] = {
        name: data.name,
        socketId: socket.id,
      };
      const shareLink = `${process.env.BASE_URL}?code=${groupId}`;
      socket.emit('group added', { groupId, shareLink, groups: this.groups[groupId] });
    });
  }
}
