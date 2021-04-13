import tap from 'tap';
import $ from 'cheerio';
import Puzzle from '../src/lib/puzzle';

import { RandomWord } from '../src/rules/interface';

tap.skip('generate random word for puzzle', async (t) => {
  const puzzle = new Puzzle();
  const result = await puzzle.randomWord();
  const response = puzzle.response;

  const data = {} as RandomWord;
  data.title = $(response).find('#shared_section > #random_word').text();
  data.description = $(response).find('#shared_section > #random_word_definition').text();

  t.deepEqual(result, data);
  t.end();
});
