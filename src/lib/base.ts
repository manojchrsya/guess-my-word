
import _ from 'lodash';
import { profiles } from '../utils/contant';
import { Group, User, Event, EventOptions } from '../rules/interface';

export default class Base {
  protected groups: { [key: string]: Group } = {};

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

  getPlayer(socket: any, groupId: string, data: User): User {
    return {
      id: data.id,
      name: data.name,
      socketId: socket.id,
      score: 0,
      played: false,
      guessed: false,
      role: data.role || 'player',
      profilePic: profiles[this.profilePicIndex(this.groups[groupId])],
    }
  }

  getRemainingUserIds(groupId: string): [] {
    const { users, settings } = this.groups[groupId] || {};
    // filter userIds from users object who have not been marked as played
    let userIds = _.keys(users).filter((userId: string) => !users[userId].played);
    if (userIds.length === 0) {
      if (settings.currentRound < settings.rounds) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_key, user] of Object.entries(this.groups[groupId]['users'])) {
          this.groups[groupId]['users'][user.id].played = false;
        }
        this.groups[groupId]['settings'].currentRound += 1;
        userIds = _.keys(users);
      }
    }
    return userIds;
  }

  pollNewAdmin(groupId: string, userId: string): void {
    if (this.groups[groupId] && this.groups[groupId]['users']) {
      const user = this.groups[groupId]['users'][userId];
      const players = this.groups[groupId]['users'];
      if (user && user.role === 'admin') {
        let userIds = _.keys(players).filter((playerId: string) => playerId !== userId);
        const playerId: string = userIds[Math.floor(Math.random() * userIds.length)];
        if (playerId) {
          // update players role as admin
          this.groups[groupId]['users'][playerId]['role'] = 'admin';
        }
      }
    }
  }

  broadcast(socket: any, event: Event, options: EventOptions): void {
    // emit group data to all user in groupId channel
    const { groupId, userId, reset } = options;
    // remove reset node from EventOptions
    delete options.reset;

    if (this.groups && this.groups[groupId]) {
      socket.emit(event, { ...options, groups: this.groups[groupId] });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [_key, user] of Object.entries(this.groups[groupId]['users'])) {
        if (user.socketId !== socket.id) {
          socket
            .to(user.socketId)
            .emit(event, { ...options, groups: this.groups[groupId] });
        }
        // reset players details
        if (reset && Object.keys(reset).length > 0) {
          Object.assign(this.groups[groupId]['users'][user.id], reset);
        }
      }
    }
  }
}
