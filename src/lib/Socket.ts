import _ from 'lodash';
import { profiles } from '../utils/contant';
export interface Group {
  id?: string;
}
export interface User {
  id: string;
  name: string;
  groupId?: string;
  socketId?: string;
  profilePic?: string;
}

export default class Socket {
  private groups: { [key: string]: Group } = {};
  private users: User[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(ioconn: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ioconn.on('connect', (socket: any) => {
      this.addGroup(socket);
      this.joinGroup(socket);
      // eslint-disable-next-line
      console.log(`socket connected ${socket.id}`);
    });
  }

  getUniqId(): string {
    return Math.random().toString(36).substring(2);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addGroup(socket: any): void {
    socket.on('create group', async (data: User) => {
      const groupId = this.getUniqId();
      this.groups[groupId] = {};
      this.groups[groupId][data.id] = {
        name: data.name,
        socketId: socket.id,
        profilePic: profiles[0],
      };
      // eslint-disable-next-line
      console.log(this.groups[groupId]);
      const shareLink = `${process.env.BASE_URL}?code=${groupId}`;
      socket.emit('group added', { groupId, shareLink, groups: this.groups[groupId] });
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  joinGroup(socket: any): void {
    socket.on('join group', async (data: User) => {
      const { groupId } = data;
      // TODO:: if groupId not received then get random groupId from `this.groups`
      if (groupId) {
        this.groups[groupId] = this.groups[groupId] || {};
        this.groups[groupId][data.id] = {
          name: data.name,
          socketId: socket.id,
          profilePic: profiles[0],
        } as User;
        socket.emit('group joined', { groupId, groups: this.groups[groupId] });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_key, user] of Object.entries(this.groups[groupId])) {
          if (user.socketId !== socket.id) {
            socket
              .to(user.socketId)
              .emit('group joined', { groupId, groups: this.groups[groupId] });
          }
        }
      }
    });
  }
}
