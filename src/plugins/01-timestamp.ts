import { FastifyPluginAsync, FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
// the use of fastify-plugin is required to be able
// to export the decorators to the outer scope

// define options
// export interface MyPluginOptions {
//   myPluginOption: string
// }

const TimeStamp : FastifyPluginAsync = async function (fastify : FastifyInstance) {
  console.log('hloeee');
  fastify.decorate('timestamp', () => Date.now());
  return Promise.resolve();
}

export default fp(TimeStamp, '3.x')
