import tap from 'tap';
const ioClient = require('socket.io-client');
import app from '../src/server';
import { User } from '../src/rules/interface';
import { describe, it, before, after } from 'tap/lib/mocha';
import Socket from '../src/lib/socket';
const HOST = '0.0.0.0';
const PORT = '3000';

describe('should start executing server test cases', () => {
  let client;
  const user = {} as User;
  before('start server and intialize socket client instance', async () => {
    await new Promise<void>((resolve) => {
      app.listen(PORT, HOST, (err) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.log(err);
          process.exit(1);
        }
        return resolve();
      });
      app.ready((err) => {
        if (err) throw err;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new Socket(app.io);
        return resolve();
      });
    });
    client = ioClient(`http://${HOST}:${PORT}`, {
      transports: ['websocket'],
      'force new connection': true,
    });
    // initialize user
    user.name = 'temp user';
    user.id = Math.random().toString(36).substring(2);
    return true;
  });

  after('should stop server and disconnect socket client', () => {
    app.close();
    client.disconnect();
  });

  describe('connect', () => {
    it('should connect socket', (done) => {
      client.on('connect', () => {
        tap.equal(client.connected, true);
        done();
      });
    });

    it('should create group in server', (done) => {
      client.emit('create group', user);
      client.on('group added', (data) => {
        tap.ok(data, 'response received from server');
        done();
      });
    });
  });
});
