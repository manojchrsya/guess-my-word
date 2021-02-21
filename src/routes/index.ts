
import { FastifyInstance } from 'fastify'
import IndexController from '../controllers';

export default async function (fastify: FastifyInstance, _opts : any) {
  const indexController : IndexController =  new IndexController();
  fastify.get('/', indexController.home);
}
