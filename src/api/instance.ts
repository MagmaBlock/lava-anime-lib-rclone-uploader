import axios, { AxiosInstance } from "axios";

export let lavaAnimeLibAPI: AxiosInstance | null = null;

export function createAPIInstance(baseURL: string, referer?: string) {
  lavaAnimeLibAPI = axios.create({
    baseURL: baseURL,
    headers: {
      Referer: referer,
    },
  });
}
