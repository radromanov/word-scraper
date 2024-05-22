import axios from "axios";
import { load } from "cheerio";
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
  private currentProxy: ProxyResult | null = null;
  private requests: number;
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
    this.requests = 0;
  }

  async incr() {
    // if requests reach 500, we need to .shift() the available array for a new one
    this.requests++;
  }

  private async reset() {
    this.requests = 0;
  }

  async get() {
    if (this.requests >= 500 || !this.currentProxy) {
      await this.obtain();
      await this.use();
      // Reset the requests counter after obtaining and using a proxy
      this.reset();
    }

    return this.currentProxy!;
  }

  // Initialize Cheerio with HTML from a URL
  private async init(url: string) {
    try {
      const response = await axios.get(url);
      const html = response.data;
      return load(html);
    } catch (error: any) {
      console.error(
        `Error initializing Cheerio with url ${url}:`,
        error.message
      );
      throw new Error(
        `Error initializing Cheerio with url ${url}: ${error.message}`
      );
    }
  }

  // Obtain a proxy by navigating pages and extracting proxies
  private async obtain() {
    console.log("Obtaining new proxy, please wait...");
    this.time = "";
    const startTime = performance.now();

    if (this.visited.length > 1) {
      await delay(2500);
    }

    await this.pickPage();
    await this.getList();

    const endTime = performance.now();
    this.time = formatDuration(endTime - startTime);

    console.log("\n[OBTAIN] ✈️ Visited pages:", this.visited);
    console.log(
      `[OBTAIN] 💰 Found ${this.available.length} proxies on page ${this.url}`
    );
    console.log("[OBTAIN] 🎯 Total attempts:", this.visited.length);
    console.log(`[OBTAIN] 🕐 Time taken:`, this.time);

    console.log(`[OBTAIN] Available proxies:`, this.available);
    console.log("[OBTAIN] Upcoming proxies:", this.next);

    this.time = "";
  }

  // Use a proxy and refresh if necessary
  private async use() {
    if (this.available.length === 0) {
      await this.obtain();
    }

    const proxy = this.available.shift();

    if (proxy) {
      this.currentProxy = proxy;
      this.used.push(proxy);
      console.log("[PROXY] 💻 Using proxy:", this.currentProxy);
    } else {
      await this.obtain();
    }

    await this.refresh();
  }

  private async refresh() {
    while (this.available.length < 10 && this.next.length > 0) {
      const nextProxy = this.next.shift();
      if (nextProxy) {
        this.available.push(nextProxy);
      }
    }

    if (this.next.length === 0) {
      console.log("[REFRESH] Filling next array...");
      await this.pickPage();
      await this.getList();
    }
  }
  private async getList(): Promise<void> {
    const cheerio = await this.init(this.url);

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

      const proxy = { host, port, protocol };

      if (
        this.hostIsValid(host) &&
        this.protocolIsValid(protocol) &&
        !this.isUsed(proxy)
      ) {
        if (this.next.length < 10)
          // Always push the proxy to the next array
          this.next.push(proxy);
      }
    });

    // Check if the available array is empty
    if (this.available.length === 0) {
      // If available array is empty, fill it with proxies from the next array
      while (this.available.length < 10 && this.next.length > 0) {
        const proxy = this.next.shift();
        if (proxy) {
          this.available.push(proxy);
        }
      }

      // Pick a new page and get the list of proxies
      await this.pickPage();
      await this.getList();
    }

    // If no valid proxies found, retry
    if (this.available.length === 0) {
      console.log("[PROXIES] ♻️ No valid proxies found, retrying...\n");
      await this.pickPage();
      await this.getList();
    }
  }

  // Validate protocol
  private protocolIsValid(protocol: string): boolean {
    return protocol === "https" || protocol === "http";
  }

  // Validate host/IP address format
  private hostIsValid(host: string): boolean {
    const hostRegex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return hostRegex.test(host);
  }

  // Check if the proxy is already used
  private isUsed(proxy: ProxyResult): boolean {
    return this.used.some(
      (element) =>
        element.host === proxy.host &&
        element.port === proxy.port &&
        element.protocol === proxy.protocol
    );
  }

  // Pick a random page from the proxy list
  private async pickPage() {
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
    this.url = `${BASE_LINK}?page=${this.page}`;

    return this.url;
  }

  // Generate a random page number
  private async generatePage(last: number): Promise<number> {
    let current = Math.floor(Math.random() * last) + 1;

    while (this.visited.includes(current)) {
      console.log(`Page number ${current} already used, skipping...`);
      console.log(`Visited pages: ${this.visited}\n`);
      await delay(1500); // Delay before retrying
      current = Math.floor(Math.random() * last) + 1;
    }

    this.visited.push(current);
    return current;
  }
}

export default Proxy;
