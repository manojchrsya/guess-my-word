import fastify, { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import App from './app';
import socketioServer from 'fastify-socket.io';
import Socket from './lib/socket';

// const app = Fastify({ logger: true, pluginTimeout: 4000 });
const app: FastifyInstance = fastify({ logger: true, pluginTimeout: 4000 });

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socketInstance: any;
    }
  }
}

// Register your application as a normal plugin.
app.register(fp(App), {});
// register fastify socket io
app.register(socketioServer);

const start = (): void => {
  // connect socket after app ready event
  app.ready((err) => {
    if (err) throw err;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.socketInstance = new Socket(app.io);
  });

  // start you server and listing on specified port
  app.listen(process.env.PORT || 3000, '0.0.0.0', (err) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.log(err);
      process.exit(1);
    }
  });
};

if (require.main === module) {
  start();
}

export default app;
