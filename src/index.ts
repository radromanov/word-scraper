import axios from "axios";
import { scrape } from "./core";
import { load } from "cheerio";

async function obtainProxy() {
  const BASE_LINK = "https://iproyal.com/free-proxy-list/";
  const PAGE_LINK = "https://iproyal.com/free-proxy-list/?page=";
  const PREV_PAGE = 1;

  const response = await axios.get(BASE_LINK);
  const html = response.data;
  const cheerio = load(html);

  function config() {
    const result: { ip: string; protocol: string } = { ip: "", protocol: "" };
    const lines = cheerio("section .astro-lmapxigl .overflow-auto .grid")
      .last()
      .text()
      .trim()
      .split("\n");

    lines.forEach((line) => {
      const match = line.match(
        /^(\d+\.\d+\.\d+\.\d+)\d+(https|http|socks4|socks5)/
      );
      if (match) {
        result["ip"] = match[1];
        result["protocol"] = match[2];
      }
    });

    return result;
  }

  return config();
}

await obtainProxy();
// await scrape();
