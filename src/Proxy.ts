import axios from "axios";
import { load, type AnyNode, type Cheerio } from "cheerio";
import { delay, formatDuration } from "../lib/helpers";
import type { ProxyResult } from "../lib/types";

/**
 * export type ProxyResult = {
 *   host: string;
 *   port: number;
 *   protocol: string;
 * };
 */

class Proxy {
  private visited: number[] = [];
  private used: ProxyResult[] = [];
  private available: ProxyResult[] = [];
  private next: ProxyResult[] = [];

  private url: string;
  private page: number;
  private time: string;

  constructor() {
    this.url = "";
    this.page = -1;
    this.time = "";
  }

  // Initialize Cheerio with HTML from a URL
  private async init(url: string) {
    try {
      const response = await axios.get(url); // Fetch the main page HTML
      const html = response.data;
      return load(html); // Load HTML into Cheerio
    } catch (error: any) {
      console.error(
        `Error initializing Cheerio with url ${url}:`,
        error.message
      );
      throw new Error(
        `Error initializing Cheerio with url ${url}:`,
        error.message
      );
    }
  }

  async obtain() {
    this.time = "";
    const startTime = performance.now();

    if (this.visited.length > 1) {
      await delay(2500); // Add delay after the first attempt
    }

    await this.pickPage();
    await this.getList();

    const endTime = performance.now();
    this.time = formatDuration(endTime - startTime);

    console.log("\n[OBTAIN] ✈️Visited pages:", this.visited);
    console.log(
      `[OBTAIN] 💰Found ${this.available.length} proxies on page ${this.url}`
    );
    console.log("[OBTAIN] 🎯Total attempts:", this.visited.length);
    console.log(`[OBTAIN] 🕐Time taken:`, this.time);

    this.time = "";
  }

  // Method to get proxy list from a specific URL
  async getList(): Promise<void> {
    const cheerio = await this.init(this.url);

    console.log("[PROXIES] 🌎Current URL:", this.url);
    console.log("[PROXIES] 📄Current Page:", this.page);

    // Parse HTML to extract proxy details
    cheerio(".grid.card-mode-layout").each((_i, element) => {
      const host = cheerio(element)
        .find(".flex.items-center")
        .eq(0)
        .text()
        .trim();
      const port = parseInt(
        cheerio(element).find(".flex.items-center").eq(1).text().trim(),
        10
      );
      const protocol = cheerio(element)
        .find(".flex.items-center")
        .eq(2)
        .text()
        .trim();

      if (
        (this.hostIsValid(host) && protocol === "http") ||
        protocol === "https"
      ) {
        this.available.push({ host, port, protocol });
      }
    });

    // No valid proxiies found
    if (this.available.length === 0) {
      console.log("[PROXIES] ♻️No valid proxies found, retrying...\n");
      await this.pickPage();
      return await this.getList();
    }
  }

  private hostIsValid(host: string) {
    // Validate host/IP address format
    const hostRegex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return hostRegex.test(host);
  }

  // Method to pick a random page from the proxy list
  async pickPage() {
    const BASE_LINK = process.env.PROXY_LIST;
    const cheerio = await this.init(BASE_LINK);

    // Extract the last page number
    const lastPage = parseInt(
      cheerio("[data-v-1e25dd90] .outlined-button")
        .prev()
        .text()
        .split(" ")
        .pop() || "1",
      10
    );

    this.page = await this.generatePage(lastPage);
    const PAGE_LINK = BASE_LINK + `?page=${this.page}`;
    this.url = PAGE_LINK;

    return PAGE_LINK;
  }

  // Generate a random page number
  private async generatePage(last: number) {
    let current = Math.floor(Math.random() * last) + 1; // Generate a random page number

    while (this.visited.includes(current)) {
      console.log(`Page number ${current} already used, skipping...`);
      console.log(`Visited pages: ${this.visited}\n`);
      current = Math.floor(Math.random() * last) + 1; // Generate a new random page number

      await delay(1500); // Delay before retrying
    }

    this.visited.push(current); // Add to visited pages

    return current;
  }
}

export default Proxy;
