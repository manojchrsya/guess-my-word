import fetch from 'node-fetch';
import cheerio from 'cheerio';
import puppeteer from 'puppeteer';
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

    // Try simple HTTP fetch first
    try {
      this._response = await this.parseUrl(this.url);
      const parsed = this.extractWord(this._response);
      if (parsed.title && parsed.description) {
        return parsed;
      }
    } catch (e) {
      // ignore and fall back to puppeteer
    }

    // Fallback: use Puppeteer to bypass bot protection
    this._response = await this.fetchWithPuppeteer(this.url);
    const parsed = this.extractWord(this._response);
    return parsed;
  }

  async parseUrl(url: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch random word: ${res.status}`);
    }
    return res.text();
  }

  async fetchWithPuppeteer(url: string): Promise<string> {
    // Use PUPPETEER_EXECUTABLE_PATH if provided (e.g. in constrained environments)
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: executablePath || undefined,
    });

    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' });

      const html = await page.content();
      return html;
    } finally {
      await browser.close();
    }
  }

  private extractWord(html: string): RandomWord {
    const data: RandomWord = {} as RandomWord;
    const $ = cheerio.load(html);

    data.title = $('#shared_section > #random_word').text().trim();
    data.description = $('#shared_section > #random_word_definition').text().trim();

    return data;
  }
}
