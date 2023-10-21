export const config = {
  // 后端 API baseUrl
  lavaAnimeLibBaseURL: "http://server-api.server.com",

  /**
   * 附带的 Referer
   * 如果你的后端开启了 Referer 限制，且不接受空 Referer，请在此配置一个可用的 Referer
   */
  lavaAnimeLibReferer: "",

  /**
   * rclone 目标路径
   * LavaAnimeLib 之前 (不含 LavaAnimeLib) 的路径,
   * 需为 JSON 数组字符串.
   */
  rcloneDestinations: ["D:", "2AG:"],

  // Mirai VerifyKey
  miraiVerifyKey: "YourMiraiVerifyKey",
};
