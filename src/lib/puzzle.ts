import { RandomWord } from '../rules/interface';

// A curated list of common English nouns with simple descriptions.
// This avoids external HTTP requests and bot protection issues and
// gives fast, deterministic puzzle generation.
const NOUNS: RandomWord[] = [
  { title: 'apple', description: 'A round fruit that grows on trees.' },
  { title: 'bridge', description: 'A structure built to cross over a river, road, or valley.' },
  { title: 'planet', description: 'A large round object that orbits a star in space.' },
  { title: 'river', description: 'A large natural stream of water flowing to the sea or a lake.' },
  { title: 'castle', description: 'A large strong building, often from medieval times.' },
  { title: 'forest', description: 'A large area covered mainly with trees and plants.' },
  { title: 'camera', description: 'A device used to take photographs or record video.' },
  { title: 'rocket', description: 'A vehicle that travels into space.' },
  { title: 'guitar', description: 'A musical instrument with strings that you play with your fingers or a pick.' },
  { title: 'island', description: 'A piece of land completely surrounded by water.' },
  { title: 'mountain', description: 'A very high hill, often with a rocky peak.' },
  { title: 'bicycle', description: 'A vehicle with two wheels that you pedal to move.' },
  { title: 'window', description: 'An opening in a wall that lets in light, usually covered with glass.' },
  { title: 'lantern', description: 'A portable light, often in a protective case.' },
  { title: 'compass', description: 'A tool used to show direction, with a needle that points north.' },
  { title: 'puzzle', description: 'A game or problem that tests your knowledge or imagination.' },
  { title: 'anchor', description: 'A heavy object used to keep a boat in one place.' },
  { title: 'helmet', description: 'Protective headgear worn for safety.' },
  { title: 'keyboard', description: 'A set of keys used for typing on a computer.' },
  { title: 'lighthouse', description: 'A tall building with a light that guides ships at sea.' },
];

export default class Puzzle {
  private _response: string;

  get response() {
    return this._response;
  }

  async randomWord(): Promise<RandomWord> {
    // Pick a random noun from the local list.
    const index = Math.floor(Math.random() * NOUNS.length);
    const word = NOUNS[index];

    // Store the raw JSON response string for compatibility with the
    // original `response` getter.
    this._response = JSON.stringify(word);

    return word;
  }
}
