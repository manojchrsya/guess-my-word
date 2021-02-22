import { FastifyPluginAsync, FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import Promise from 'bluebird';

// the use of fastify-plugin is required to be able
// to export the decorators to the outer scope
declare module 'fastify' {
  interface FastifyReply {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    locals: any;
  }
}
const FastifyGlobal: FastifyPluginAsync = async function (fastify: FastifyInstance) {
  global.Promise = Promise;
  // adding pre handler for locals
  fastify.addHook('preHandler', (_request: FastifyRequest, reply: FastifyReply, next) => {
    // eslint-disable-next-line no-param-reassign
    reply.locals = reply.locals || {};
    // eslint-disable-next-line no-param-reassign
    reply.locals.url = process.env.BASE_URL;
    // eslint-disable-next-line no-param-reassign
    reply.locals.errors = [];
    return next();
  });
};

export default fp(FastifyGlobal, '3.x');
