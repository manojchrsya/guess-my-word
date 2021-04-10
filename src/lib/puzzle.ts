import request from 'request';
import cheerio from 'cheerio';

const URL = 'https://randomword.com/noun';

export type RandomWord = {
  title: string;
  description: string;
};

export default class Puzzle {
  private url = URL;

  async randomWord(): Promise<RandomWord> {
    const data: RandomWord = {} as RandomWord;
    const response = await this.parseUrl(this.url);
    const $ = cheerio.load(response);
    data.title = $(response).find('#shared_section > #random_word').text();
    data.description = $(response).find('#shared_section > #random_word_definition').text();
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
