import axios from "axios";

const response = await axios.get("https://www.thesaurus.com/list/a");
console.log(response.data);
