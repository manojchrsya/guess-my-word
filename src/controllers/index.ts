import { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyReply {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    view: any;
  }
}

export default class IndexController {
  async home(_request: FastifyRequest, reply: FastifyReply) {
    return reply.view('image-to-speech.ejs');
  }
}
