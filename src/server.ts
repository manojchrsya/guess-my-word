import fastify, { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import App from './app'

// const app = Fastify({ logger: true, pluginTimeout: 4000 });
const app: FastifyInstance = fastify({ logger: true, pluginTimeout: 4000 });

// Register your application as a normal plugin.
app.register(fp(App), {});
if (require.main === module) {
  // start you server and listing on specified port
  app.listen(process.env.PORT || 3000, '0.0.0.0', (err) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
  });
}
