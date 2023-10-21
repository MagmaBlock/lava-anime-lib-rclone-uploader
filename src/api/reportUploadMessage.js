import { LavaAnimeLibAPI } from "../tools/axiosInstance.js";

/**
 * 上报上传成功消息
 * @param {String} index
 * @param {String} fileName
 * @returns {Promise}
 */
export function reportUploadMessage(index, fileName) {
  return LavaAnimeLibAPI.post("/v2/report/upload-message", {
    index,
    fileName,
  });
}
