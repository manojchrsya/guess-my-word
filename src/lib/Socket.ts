import _ from 'lodash';
import { profiles } from '../utils/contant';
export interface Group {
  id?: string;
}
export interface User {
  id: string;
  name: string;
  score?: number;
  groupId?: string;
  socketId?: string;
  profilePic?: string;
}
export interface Settings {
  rounds: number;
  timings: number;
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
      this.userDisconnected(socket);
    });
  }

  getUniqId(): string {
    return Math.random().toString(36).substring(2);
  }

  profilePicIndex(group: Group): number {
    return _.keys(group).length % profiles.length;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addGroup(socket: any): void {
    socket.on('create group', async (data: User) => {
      const groupId = this.getUniqId();
      this.groups[groupId] = {};
      this.groups[groupId][data.id] = {
        id: data.id,
        name: data.name,
        socketId: socket.id,
        score: 0,
        profilePic: profiles[this.profilePicIndex(this.groups[groupId])],
      };

      // add groupId and userId in socket instance
      socket.groupId = groupId;
      socket.userId = data.id;

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
          id: data.id,
          name: data.name,
          socketId: socket.id,
          score: 0,
          profilePic: profiles[this.profilePicIndex(this.groups[groupId])],
        } as User;
        // add groupId and userId in socket instance
        socket.groupId = groupId;
        socket.userId = data.id;

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userDisconnected(socket: any): void {
    socket.on('disconnect', async () => {
      const { groupId, userId } = socket;
      if (groupId && this.groups[groupId]) {
        delete this.groups[groupId][userId];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_key, user] of Object.entries(this.groups[groupId])) {
          socket.to(user.socketId).emit('group joined', { groupId, groups: this.groups[groupId] });
        }
      }
    });
  }
}
