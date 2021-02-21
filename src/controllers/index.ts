import { FastifyRequest, FastifyReply  } from 'fastify';

declare module 'fastify' {
  interface FastifyReply {
    view: any,
  }
}

export default class IndexController {
  async home(_request: FastifyRequest, reply: FastifyReply) {
    return reply.view('image-to-speech.ejs');
  }
}
