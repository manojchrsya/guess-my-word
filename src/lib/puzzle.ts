import fetch from 'node-fetch';
import cheerio from 'cheerio';
import { RandomWord } from '../rules/interface';
const URL = 'https://randomword.com/noun';

export default class Puzzle {
  private url = URL;
  private _response: string;

  get response() {
    return this._response;
  }

  async randomWord(): Promise<RandomWord> {
    const data: RandomWord = {} as RandomWord;
    this._response = await this.parseUrl(this.url);
    const $ = cheerio.load(this._response);
    data.title = $(this._response).find('#shared_section > #random_word').text();
    data.description = $(this._response).find('#shared_section > #random_word_definition').text();
    return data;
  }

  async parseUrl(url: string): Promise<string> {
    return fetch(url).then((res) => res.text());
  }
}
