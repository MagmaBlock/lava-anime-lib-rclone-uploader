import { LavaAnimeLibAPI } from "../tools/axiosInstance.js";
import { config } from "../tools/config.js";

export async function sendMiraiMessage(messageChain) {
  try {
    return await LavaAnimeLibAPI.post("/v2/notifier/message", {
      messageChain,
      verifyKey: config.miraiVerifyKey,
    });
  } catch (error) {
    console.error(error, "发送 Mirai 消息失败");
  }
}
