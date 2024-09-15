import fs from 'node:fs';
import path from 'node:path';
import { readSubtitles } from '../video/subtitle/read-subtitles';

/**
 * 从视频文件中提取字幕并保存为单独的文件
 * @param videoFilePath 视频文件路径
 * @returns 包含所有提取的字幕文件路径的数组
 */
export async function extractAndSaveSubtitles(videoFilePath: string): Promise<string[]> {
  // 提取字幕
  const subtitles = await readSubtitles(videoFilePath);
  // 初始化结果数组
  const results: string[] = [];

  // 获取视频所在目录和文件名（不含扩展名）
  const videoDir = path.dirname(videoFilePath);
  const videoName = path.basename(videoFilePath, path.extname(videoFilePath));

  // 遍历每个提取的字幕
  for (const subtitle of subtitles) {
    // 构建字幕文件名
    const parts = [videoName, subtitle.index.toString()];
    if (subtitle.language) parts.push(subtitle.language);
    if (subtitle.title) parts.push(subtitle.title);
    const subtitleFileName = `${parts.join('.')}.${subtitle.format}`;
    const subtitleFilePath = path.join(videoDir, subtitleFileName);

    // 将字幕内容写入文件
    fs.writeFileSync(subtitleFilePath, subtitle.content);
    // 将字幕文件路径添加到结果数组
    results.push(subtitleFilePath);
  }

  // 返回包含所有字幕文件路径的数组
  return results;
}
