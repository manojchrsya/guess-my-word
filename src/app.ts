import path from 'path';
import AutoLoad from 'fastify-autoload';
import { FastifyInstance } from 'fastify';
import initConfig from './lib/config';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async (fastify: FastifyInstance, opts: any) => {
  // initilize and load all config from .env file
  initConfig();

  // 1. set default template enging to render pages
  // 2. server static file from server
  fastify
    .register(require('point-of-view'), {
      engine: { ejs: require('ejs') },
      root: path.join(__dirname, 'views'),
    })
    .register(require('fastify-static'), { root: path.join(__dirname, 'public') })
    .register(require('fastify-cors'), { exposedHeaders: 'Content-Disposition' })
    .register(require('fastify-compress'), { threshold: 0 })
    .register(require('fastify-formbody'));

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: { ...opts },
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: { ...opts },
  });
};
