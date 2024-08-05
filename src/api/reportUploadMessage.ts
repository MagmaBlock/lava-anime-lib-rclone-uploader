import { AxiosResponse } from "axios";
import { lavaAnimeLibAPI } from "./instance";

/**
 * 上报上传成功消息
 * @param index
 * @param fileName
 * @returns
 */
export function reportUploadMessage(
  index: string,
  fileName: string
): Promise<AxiosResponse> {
  if (lavaAnimeLibAPI === null) return Promise.reject();
  return lavaAnimeLibAPI.post("/v2/report/upload-message", {
    index,
    fileName,
  });
}
