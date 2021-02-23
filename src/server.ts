import fastify, { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import App from './app';
import socketioServer from 'fastify-socket.io';
import Socket from './lib/socket';

// const app = Fastify({ logger: true, pluginTimeout: 4000 });
const app: FastifyInstance = fastify({ logger: true, pluginTimeout: 4000 });

// Register your application as a normal plugin.
app.register(fp(App), {});
// register fastify socket io
app.register(socketioServer);

if (require.main === module) {
  // connect socket after app ready event
  app.ready((err) => {
    if (err) throw err;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.io.on('connect', (socket: any) => new Socket(socket));
  });

  // start you server and listing on specified port
  app.listen(process.env.PORT || 3000, '0.0.0.0', (err) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.log(err);
      process.exit(1);
    }
  });
}
