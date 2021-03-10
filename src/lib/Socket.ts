import _ from 'lodash';
import sanitizeHtml from 'sanitize-html';
import { profiles } from '../utils/contant';

enum GameStatus {
  start,
  stop,
  finish,
}
export interface User {
  id: string;
  name: string;
  role: string;
  score?: number;
  groupId?: string;
  socketId?: string;
  profilePic?: string;
}
export interface Settings {
  rounds: number;
  timings: number;
  puzzle: string;
  userId?: string;
  status: GameStatus;
}

export interface Group {
  id?: string;
  users?: User;
  settings?: Settings;
}
export interface Chat extends User {
  message: string;
  senderId: string;
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
      this.sendMessage(socket);
      this.startGame(socket);
      this.selectPlayer(socket);
      this.drawing(socket);
      this.setPuzzle(socket);
      // eslint-disable-next-line
      console.log(`socket connected ${socket.id}`);
      this.userDisconnected(socket);
    });
  }

  getUniqId(): string {
    let uniqId = '';
    while (uniqId.length === 0) {
      uniqId = Math.random().toString(36).substring(2);
    }
    return uniqId;
  }

  profilePicIndex(group: Group): number {
    return _.keys(group).length % profiles.length;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addGroup(socket: any): void {
    socket.on('create group', async (data: User) => {
      const groupId = this.getUniqId();
      this.groups[groupId] = {};
      this.groups[groupId]['users'] = this.groups[groupId]['users'] || ({} as User);
      this.groups[groupId]['users'][data.id] = {
        id: data.id,
        name: data.name,
        socketId: socket.id,
        score: 0,
        role: 'admin',
        profilePic: profiles[this.profilePicIndex(this.groups[groupId])],
      };

      // add groupId and userId in socket instance
      socket.groupId = groupId;
      socket.userId = data.id;
      // join this socket in groupId new channel
      // socket.join(groupId);
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
        this.groups[groupId]['users'] = this.groups[groupId]['users'] || ({} as User);
        this.groups[groupId]['users'][data.id] = {
          id: data.id,
          name: data.name,
          socketId: socket.id,
          score: 0,
          played: false,
          role: 'player',
          profilePic: profiles[this.profilePicIndex(this.groups[groupId])],
        } as User;
        // add groupId and userId in socket instance
        socket.groupId = groupId;
        socket.userId = data.id;
        // join this socket in groupId new channel
        // socket.join(groupId);
        // emit group data to all user in groupId channel
        socket.emit('group joined', { groupId, groups: this.groups[groupId], userId: data.id });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_key, user] of Object.entries(this.groups[groupId]['users'])) {
          if (user.socketId !== socket.id) {
            socket
              .to(user.socketId)
              .emit('group joined', { groupId, groups: this.groups[groupId], userId: data.id });
          }
        }
      }
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startGame(socket: any): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('start game', async (data: any) => {
      const { groupId, id, settings } = data;
      if (groupId && id) {
        // apply setting data in current group
        settings.status = 'start';
        // set current playerId in setting for easy use at client side
        settings.userId = id;
        this.groups[groupId]['settings'] = settings as Settings;
        socket.emit('start game', { groupId, groups: this.groups[groupId], userId: id });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_key, user] of Object.entries(this.groups[groupId]['users'])) {
          if (user.socketId !== socket.id) {
            socket
              .to(user.socketId)
              .emit('start game', { groupId, groups: this.groups[groupId], userId: id });
          }
        }
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectPlayer(socket: any): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('select player', async (data: any) => {
      const { groupId } = data;
      if (groupId) {
        const { users } = this.groups[groupId];
        const userIds = _.keys(users);
        // select randome player from group user's
        const playerId = userIds[Math.floor(Math.random() * userIds.length)];
        if (this.groups[groupId]['users'][playerId]) {
          const player = this.groups[groupId]['users'][playerId];
          if (player.socketId !== socket.id) {
            socket.to(player.socketId).emit('select player', { groupId, player });
          } else {
            socket.emit('select player', { groupId, player });
          }
          const chat = {
            meta: `<b>${player.name}</b> is choosing a word!`,
          };
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          for (const [_key, user] of Object.entries(this.groups[groupId]['users'])) {
            if (user.socketId !== player.socketId) {
              socket.to(user.socketId).emit('new message', { groupId, chat });
            }
          }
        }
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendMessage(socket: any): void {
    socket.on('send message', async (data: Chat) => {
      const { groupId, message } = data;
      if (groupId && message) {
        const chat = {
          senderId: data.id, // set userId as senderId
          message: sanitizeHtml(message),
        };
        const sender = this.groups[groupId] && this.groups[groupId]['users'][data.id];
        const settings = this.groups[groupId] && this.groups[groupId]['settings'];
        if (settings.puzzle && chat.message.trim().toLowerCase() === settings.puzzle) {
          socket.emit('new message', { groupId, chat: { meta: 'You have guessed the word' } });
        }

        socket.emit('new message', { groupId, chat });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_key, user] of Object.entries(this.groups[groupId]['users'])) {
          if (user.socketId !== socket.id) {
            chat.message = `<b>${sender.name}:</b> ${chat.message}`;
            socket.to(user.socketId).emit('new message', { groupId, chat });
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
        socket.disconnect();
        socket.close();
        delete this.groups[groupId]['users'][userId];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_key, user] of Object.entries(this.groups[groupId]['users'])) {
          socket.to(user.socketId).emit('relaod data', { groupId, groups: this.groups[groupId] });
        }
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  drawing(socket: any): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('drawing', async (data: any) => {
      const { groupId, event } = data;
      if (groupId && event) {
        socket.emit('drawing', { groupId, event });
        if (this.groups[groupId]) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          for (const [_key, user] of Object.entries(this.groups[groupId]['users'])) {
            if (user.socketId !== socket.id) {
              socket.to(user.socketId).emit('drawing', { groupId, event });
            }
          }
        }
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setPuzzle(socket: any): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('set puzzle', async (data: any) => {
      const { groupId, settings } = data;
      if (settings.puzzle) {
        const maskedPuzzle: string = settings.puzzle
          .split('')
          .map((letter: string) => (letter.trim().length > 0 ? '_' : letter.toLowerCase()))
          .join('');
        socket.emit('set puzzle', { groupId, settings });
        if (this.groups[groupId]) {
          const player = this.groups[groupId]['users'][socket.userId];
          const chat = {
            meta: `<b>${player.name}</b> has chosen a word.`,
          };
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          for (const [_key, user] of Object.entries(this.groups[groupId]['users'])) {
            if (user.socketId !== socket.id) {
              socket
                .to(user.socketId)
                .emit('set puzzle', { groupId, settings: { ...settings, puzzle: maskedPuzzle } });
              socket.to(user.socketId).emit('new message', { groupId, chat });
            }
          }
        }
      }
    });
  }
}
