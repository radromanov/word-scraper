import axios from "axios";
import Scraper from "./Scraper";

const scaper = new Scraper();
const data = await scaper.scrape(["a"]);
