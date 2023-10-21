import axios from "axios";
import "dotenv/config.js";

export const LavaAnimeLibAPI = axios.create({
  baseURL: process.env.LAVAANIMELIB_BASEURL,
});
