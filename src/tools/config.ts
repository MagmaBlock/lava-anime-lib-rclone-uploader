import dotenv from "dotenv";

dotenv.config();

interface Config {
  lavaAnimeLibBaseURL?: string;
  lavaAnimeLibReferer?: string;
  rcloneDestinations: string[];
}

export const config: Config = {
  lavaAnimeLibBaseURL: process.env.LAVA_ANIME_LIB_BASE_URL,
  lavaAnimeLibReferer: process.env.LAVA_ANIME_LIB_REFERER,
  rcloneDestinations: process.env.RCLONE_DESTINATIONS
    ? JSON.parse(process.env.RCLONE_DESTINATIONS)
    : [],
};

if (!config.lavaAnimeLibBaseURL) {
  throw new Error("LAVA_ANIME_LIB_BASE_URL is not set");
}
if (!config.lavaAnimeLibReferer) {
  throw new Error("LAVA_ANIME_LIB_REFERER is not set");
}
if (
  !Array.isArray(config.rcloneDestinations) ||
  config.rcloneDestinations.length === 0
) {
  throw new Error("RCLONE_DESTINATIONS is not set");
}
