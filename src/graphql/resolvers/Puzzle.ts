import Puzzle from '../../lib/puzzle';
import { RandomWord } from '../../rules/interface';
const instance = new Puzzle();

const PuzzleResolver = {
  Query: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    puzzles: async (_: unknown, { limit }: { limit: number }): Promise<[RandomWord]> => {
      const promise = [];
      while (limit > 0) {
        promise.push(instance.randomWord());
        limit -= 1;
      }
      return promise as [RandomWord];
    },
  },
};

export default PuzzleResolver;
