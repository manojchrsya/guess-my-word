import { RandomWord } from '../rules/interface';
import nouns from './nouns.json';

// Local noun list loaded from nouns.json.
// This avoids external HTTP requests and bot protection issues and
// gives fast, deterministic puzzle generation.
const NOUNS = nouns as RandomWord[];

export default class Puzzle {
  private _response: string;

  get response() {
    return this._response;
  }

  async randomWord(): Promise<RandomWord> {
    if (!NOUNS.length) {
      throw new Error('Noun list is empty');
    }

    // Pick a random noun from the local list.
    const index = Math.floor(Math.random() * NOUNS.length);
    const word = NOUNS[index];

    // Store the raw JSON response string for compatibility with the
    // original `response` getter.
    this._response = JSON.stringify(word);

    return word;
  }
}
