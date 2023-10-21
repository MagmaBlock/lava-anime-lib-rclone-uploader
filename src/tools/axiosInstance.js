import axios from "axios";
import { config } from "./config.js";

export const LavaAnimeLibAPI = axios.create({
  baseURL: config.lavaAnimeLibBaseURL,
});
