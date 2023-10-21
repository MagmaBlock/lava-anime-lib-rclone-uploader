import { LavaAnimeLibAPI } from "../tools/axiosInstance.js";

export async function reportUploadMessage(index, fileName) {
  return await LavaAnimeLibAPI.post("/v2/report/upload-message", {
    index,
    fileName,
  });
}
