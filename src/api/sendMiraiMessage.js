import { LavaAnimeLibAPI } from "../tools/axiosInstance.js";

export async function sendMiraiMessage(messageChain) {
  LavaAnimeLibAPI.post("/v2/notifier/message", { messageChain });
}
