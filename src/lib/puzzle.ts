import request from 'request';
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
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      request(url, (error: any, response: { body: string | PromiseLike<string> }) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.error(error);
          return false;
        }
        return resolve(response.body);
      });
    });
  }
}
