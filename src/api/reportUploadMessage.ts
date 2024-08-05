import { AxiosResponse } from "axios";
import { LavaAnimeLibAPI } from "../tools/axiosInstance";

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
  return LavaAnimeLibAPI.post("/v2/report/upload-message", {
    index,
    fileName,
  });
}
