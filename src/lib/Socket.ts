export default class Socket {
  groups: string[];
  users: string[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(socket: any) {
    // eslint-disable-next-line no-console
    console.log(`socket connected ${socket.id}`);
  }
}
