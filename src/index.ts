// import axios from "axios";
// import { load } from "cheerio";
// import { delay } from "../lib/helpers";
// import type { ProxyResult } from "../lib/types";

import Proxy from "./Proxy";

declare module "bun" {
  interface Env {
    PROXY_LIST: string;
  }
}

const proxy = new Proxy();
await proxy.pickPage();

// // Function to scrape proxy data from a given URL
// async function config(url: string) {
//   const response = await axios.get(url); // Fetch the HTML from the URL
//   const html = response.data;
//   const cheerio = load(html); // Load HTML into Cheerio

//   const currentPage = url.split("=").pop(); // Extract current page number from URL

//   const results: ProxyResult[] = [];

//   console.log("Current page:", currentPage);
//   console.log("--- URL:", url);

//   // Parse HTML to extract proxy details
//   cheerio(".grid.card-mode-layout").each((_i, element) => {
//     const host = cheerio(element)
//       .find(".flex.items-center")
//       .eq(0)
//       .text()
//       .trim();
//     const port = cheerio(element)
//       .find(".flex.items-center")
//       .eq(1)
//       .text()
//       .trim();
//     const protocol = cheerio(element)
//       .find(".flex.items-center")
//       .eq(2)
//       .text()
//       .trim();

//     // Validate IP address format
//     const ipRegex =
//       /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
//     if (ipRegex.test(host)) {
//       results.push({ host, port: parseInt(port, 10), protocol }); // Add valid proxies to results
//     }
//   });

//   return results; // Return list of proxies
// }

// // Function to navigate to a random page on the proxy list
// async function goToPage() {
//   const BASE_LINK = "https://iproyal.com/free-proxy-list/";

//   const response = await axios.get(BASE_LINK); // Fetch the main page HTML
//   const html = response.data;
//   const cheerio = load(html);

//   // Extract the last page number
//   const lastPage = parseInt(
//     cheerio("[data-v-1e25dd90] .outlined-button")
//       .prev()
//       .text()
//       .split(" ")
//       .pop() || "1",
//     10
//   );

//   const randomPage = Math.floor(Math.random() * lastPage) + 1; // Generate a random page number
//   const PAGE_LINK = BASE_LINK + `?page=${randomPage}`;
//   return PAGE_LINK; // Return the URL of the random page
// }

// // Main function to obtain a random HTTP or HTTPS proxy
// export async function obtainProxy(attempt = 1) {
//   if (attempt > 1) {
//     await delay(2500); // Add delay after the first attempt
//   }

//   const page = await goToPage(); // Get a random page URL
//   const proxy = await config(page); // Scrape proxies from the page
//   console.log(proxy);

//   // Filter out SOCKS proxies
//   const filteredProxy = proxy.filter(
//     ({ protocol }) => protocol === "http" || protocol === "https"
//   );

//   if (filteredProxy.length === 0) {
//     console.log(
//       `No matching proxies found. Looking for a new proxy... ${attempt}\n`
//     );
//     return obtainProxy(attempt + 1); // Retry if no valid proxies are found
//   }

//   const randomProxy = Math.floor(Math.random() * filteredProxy.length);

//   console.log(`Found proxy on page ${page}`, filteredProxy[randomProxy]);
//   return filteredProxy[randomProxy]; // Return a random valid proxy
// }

// await obtainProxy();
