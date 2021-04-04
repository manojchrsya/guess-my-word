import _ from 'lodash';
import sanitizeHtml from 'sanitize-html';
import { User, Settings, Event, Chat } from '../rules/interface';
import Base from './base'

export default class Socket extends Base {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(ioconn: any) {
    super();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ioconn.on('connect', (socket: any) => {
      this.addGroup(socket);
      this.joinGroup(socket);
      this.sendMessage(socket);
      this.startGame(socket);
      this.selectPlayer(socket);
      this.drawing(socket);
      this.setPuzzle(socket);
      this.showPuzzle(socket);
      // eslint-disable-next-line
      console.log(`socket connected ${socket.id}`);
      this.userDisconnected(socket);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addGroup(socket: any): void {
    socket.on('create group', async (data: User) => {
      const groupId = this.getUniqId();
      // create new empty object
      this.groups[groupId] = {};
      this.groups[groupId]['users'] = this.groups[groupId]['users'] || ({} as User);
      data.role = 'admin';
      this.groups[groupId]['users'][data.id] = this.getPlayer(socket, groupId, data);

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
        this.groups[groupId]['users'][data.id] = this.getPlayer(socket, groupId, data);
        // add groupId and userId in socket instance
        socket.groupId = groupId;
        socket.userId = data.id;
        // emit group data to all user in groupId channel
        this.broadcast(socket, Event.GroupJoined, { groupId, userId: data.id })
      }
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startGame(socket: any): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('start game', async (data: any) => {
      const { groupId, id, settings } = data;
      if (groupId && id && this.groups[groupId]) {
        // apply setting data in current group
        settings.status = 'start';
        settings.currentRound = 1;
        // set current playerId in setting for easy use at client side
        settings.userId = id;
        this.groups[groupId]['settings'] = settings as Settings;

        // emit group data to all user in groupId channel
        const reset = { played: false, guessed: false, score: 0 };
        this.broadcast(socket, Event.StartGame, { groupId, userId: data.id, reset });
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectPlayer(socket: any): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('select player', async (data: any) => {
      const { groupId } = data;
      if (groupId) {
        // get all userIds not played in current game
        const userIds = this.getRemainingUserIds(groupId);
        if (userIds.length === 0) {
          // emit group data to all user in groupId channel if userIds is empty
          this.broadcast(socket, Event.FinishGame, { groupId, userId: data.id});
          return;
        }
        // select randome player from group user's
        const playerId: string = userIds[Math.floor(Math.random() * userIds.length)];
        if (this.groups[groupId]['users'][playerId]) {
          // set guessed variable to false'
          // set played value as true to avoid choosing same player multiple times
          Object.assign(this.groups[groupId]['users'][playerId], { guessed: false, played: true });
          const player = this.groups[groupId]['users'][playerId];
          const chat = {
            meta: `<b>${player.name}</b> is choosing a word!`,
          };
          // update playerId in group settings
          this.groups[groupId]['settings'].playerId = playerId;

          // emit group data to all user in groupId channel about selected player
          this.broadcast(socket, Event.SelectPlayer, { groupId, player });
          // emit info message to all users
          this.broadcast(socket, Event.NewMessage, { groupId, chat });
          // reload all details and update settings at client side
          const reset = { guessed: false };
          this.broadcast(socket, Event.ReloadData, { groupId, reset });
        }
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendMessage(socket: any): void {
    socket.on('send message', async (data: Chat) => {
      const { groupId, message, speed = 0 } = data;
      if (groupId && message) {
        const chat = {
          senderId: data.id, // set userId as senderId
          message: sanitizeHtml(message),
        };
        let finish = false;
        const sender = (this.groups[groupId] && this.groups[groupId]['users'][data.id]) || {};
        const settings =
          (this.groups[groupId] && this.groups[groupId]['settings']) || ({} as Settings);
        if (
          !sender.guessed &&
          settings.playerId !== data.id &&
          settings.puzzle &&
          chat.message.trim().toLowerCase() === settings.puzzle
        ) {
          socket.emit('new message', { groupId, chat: { meta: 'You have guessed the word' } });
          this.groups[groupId]['users'][data.id].score += Math.round(100 / speed) * 10;
          this.groups[groupId]['users'][data.id].guessed = true;
          sender.guessed = true;
          // check if each player has guess the word then finish game
          finish = !_.flatMap(this.groups[groupId]['users']).some(
            (user: User) => !user.guessed && user.id != settings.playerId,
          );
          socket.emit('relaod data', { groupId, groups: this.groups[groupId], finish });
        }

        socket.emit('new message', { groupId, chat });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_key, user] of Object.entries(this.groups[groupId]['users'])) {
          if (user.socketId !== socket.id) {
            const message = `<b>${sender.name}:</b> ${chat.message}`;
            socket.to(user.socketId).emit('new message', { groupId, chat: { ...chat, message } });
            if (sender.guessed) {
              socket.to(user.socketId).emit('new message', {
                groupId,
                chat: { meta: `${sender.name} has guessed the word.` },
              });
              socket
                .to(user.socketId)
                .emit('relaod data', { groupId, groups: this.groups[groupId], finish });
            }
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
        this.pollNewAdmin(groupId, userId);
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
        const maskedPuzzle: string = sanitizeHtml(settings.puzzle)
          .split('')
          .map((letter: string) => (letter.trim().length > 0 ? '_' : letter.toLowerCase()))
          .join('');
        socket.emit('set puzzle', { groupId, settings });
        if (this.groups[groupId]) {
          // update puzzle in group settings
          this.groups[groupId]['settings'] = this.groups[groupId]['settings'] || ({} as Settings);
          this.groups[groupId]['settings'].puzzle = sanitizeHtml(settings.puzzle);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showPuzzle(socket: any): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('show puzzle', async (data: any) => {
      const { groupId } = data;
      if (groupId && this.groups[groupId]) {
        const settings = this.groups[groupId]['settings'];
        const chat = {
          meta: `word was ${settings.puzzle}`,
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_key, user] of Object.entries(this.groups[groupId]['users'])) {
          if (user.socketId !== socket.id) {
            socket.to(user.socketId).emit('new message', { groupId, chat });
          }
        }
      }
    });
  }
}
