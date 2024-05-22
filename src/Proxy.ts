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
  private visited: number[] = [];
  private used: ProxyResult[] = [];
  private available: ProxyResult[] = [];
  private next: ProxyResult[] = [];
  private attempt: number = 1;

  private currentURL: string;
  private currentPage: number;
  private numPagesChecked: number;
  private time: string;

  constructor() {
    this.currentURL = "";
    this.currentPage = -1;
    this.numPagesChecked = 0;
    this.time = "";
  }

  // Initialize Cheerio with HTML from a URL
  private async init(url: string) {
    try {
      const response = await axios.get(url); // Fetch the main page HTML
      const html = response.data;
      return load(html); // Load HTML into Cheerio
    } catch (error) {
      console.error("Error initializing Cheerio:", error);
      throw new Error("Failed to initialize Cheerio.");
    }
  }

  // Method to get proxy list from a specific URL (implementation pending)
  private async getList(url: string) {
    const cheerio = await this.init(url);
    // Implementation to extract proxy list goes here
  }

  // Method to pick a random page from the proxy list
  async pickPage() {
    this.time = "";
    const startTime = performance.now();

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

    const page = await this.generatePage(lastPage);

    const endTime = performance.now();
    this.time = formatDuration(endTime - startTime);

    const PAGE_LINK = BASE_LINK + `?page=${page}`;
    this.currentURL = PAGE_LINK;
    this.currentPage = page;

    console.log("[PAGE] ✈️ Visited pages:", this.visited);
    console.log("[PAGE] 🌎 Current URL:", this.currentURL);
    console.log("[PAGE] 📄 Current Page:", this.currentPage);
    console.log("[PAGE] 📚 Total pages checked:", this.numPagesChecked);
    console.log("[PAGE] 🕐 Time taken:", this.time);

    this.time = "";
    return PAGE_LINK;
  }

  // Generate a random page number
  private async generatePage(last: number) {
    let current = Math.floor(Math.random() * last) + 1; // Generate a random page number
    this.numPagesChecked++;

    while (this.visited.includes(current)) {
      console.log(`Page number ${current} already used, skipping...`);
      console.log(`Visited pages: ${this.visited}\n`);
      current = Math.floor(Math.random() * last) + 1; // Generate a new random page number
      this.numPagesChecked++;

      await delay(1500); // Delay before retrying
    }

    this.visited.push(current); // Add to visited pages

    return current;
  }
}

export default Proxy;
