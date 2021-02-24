import { FastifyRequest, FastifyReply } from 'fastify';
declare module 'fastify' {
  interface FastifyReply {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    view: any;
  }
}
export default class IndexController {
  async home(request: FastifyRequest<{ Querystring: { code?: string } }>, reply: FastifyReply) {
    const { code } = request.query;
    return reply.view('index.ejs', { code });
  }
}
