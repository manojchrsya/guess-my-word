enum GameStatus {
  start,
  stop,
  finish,
}

export enum Event {
  GroupJoined = 'group joined',
  GroupAdded = 'group added',
  StartGame = 'start game',
  SelectPlayer = 'select player',
  FinishGame = 'finish game',
  NewMessage = 'new message',
  ReloadData = 'relaod data',
}

export interface User {
  id: string;
  name: string;
  role: string;
  guessed?: boolean;
  played?: boolean;
  score?: number;
  groupId?: string;
  socketId?: string;
  profilePic?: string;
}
export interface Settings {
  rounds: number;
  currentRound: number;
  timings: number;
  puzzle: string;
  userId?: string;
  playerId?: string;
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
  speed: number;
}

export interface EventOptions {
  groupId: string,
  userId?: string,
  reset?: object,
  player?: User,
  chat?: any
}