import axios from "axios";
import { load } from "cheerio";
import { delay } from "../lib/helpers";

// Function to scrape proxy data from a given URL
async function config(url: string) {
  const response = await axios.get(url);
  const html = response.data;
  const cheerio = load(html);

  const splitUrl = url.split("=");
  const currentPage = splitUrl[splitUrl.length - 1];

  const results: {
    host: string;
    port: number;
    protocol: string;
  }[] = [];

  console.log("Current page:", currentPage);
  console.log("--- URL:", url);

  cheerio(".grid.card-mode-layout").each((_i, element) => {
    const host = cheerio(element)
      .find(".flex.items-center")
      .eq(0)
      .text()
      .trim();
    const port = cheerio(element)
      .find(".flex.items-center")
      .eq(1)
      .text()
      .trim();
    const protocol = cheerio(element)
      .find(".flex.items-center")
      .eq(2)
      .text()
      .trim();

    const ipRegex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipRegex.test(host)) {
      results.push({ host, port: parseInt(port, 10), protocol });
    }
  });

  return results;
}

// Function to navigate to a random page on the proxy list
async function goToPage() {
  const BASE_LINK = "https://iproyal.com/free-proxy-list/";

  const response = await axios.get(BASE_LINK);
  const html = response.data;
  const cheerio = load(html);

  const lastPage = parseInt(
    cheerio("[data-v-1e25dd90] .outlined-button")
      .prev()
      .text()
      .split(" ")
      .pop() || "1",
    10
  );

  const randomPage = Math.floor(Math.random() * lastPage) + 1;
  const PAGE_LINK = BASE_LINK + `?page=${randomPage}`;
  return PAGE_LINK;
}

// Main function to obtain a random HTTP or HTTPS proxy
export async function obtainProxy(attempt: number = 1) {
  // Add delay after the first attempt
  if (attempt > 1) {
    await delay(2500);
  }

  const page = await goToPage();
  const proxy = await config(page);
  console.log(proxy);

  // Filter out proxies with SOCKS protocols and match the required IP, port, and location
  const filteredProxy = proxy.filter(
    ({ protocol }) => protocol === "http" || protocol === "https"
  );

  if (filteredProxy.length === 0) {
    console.log(
      `No matching proxies found. Looking for a new proxy... ${attempt}\n`
    );
    return obtainProxy(attempt + 1); // Retry to obtain a new proxy
  }

  const randomProxy = Math.floor(Math.random() * filteredProxy.length);

  console.log(`Found proxy on page ${page}`, filteredProxy[randomProxy]);
  return filteredProxy[randomProxy];
}

await obtainProxy();
