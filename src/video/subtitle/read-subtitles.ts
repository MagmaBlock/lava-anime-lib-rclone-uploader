import { spawn } from 'node:child_process';

interface SubtitleInfo {
  content: string;
  format: 'srt' | 'ass';
  index: number;
  filePath: string;
  language?: string;
  title?: string;
}

/**
 * 从视频文件中提取字幕
 * @param filePath 视频文件路径
 * @returns 包含字幕内容和格式的数组
 */
export async function readSubtitles(filePath: string): Promise<SubtitleInfo[]> {
  return new Promise((resolve, reject) => {
    // 使用ffprobe获取视频文件的字幕流信息
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_streams',
      '-select_streams', 's',
      filePath
    ]);

    let stdout = '';
    let stderr = '';

    ffprobe.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ffprobe.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffprobe.on('close', async (code) => {
      if (code === 0) {
        try {
          // 解析ffprobe输出的JSON数据
          const subtitleStreams = JSON.parse(stdout).streams;
          const subtitles: SubtitleInfo[] = [];

          // 遍历每个字幕流
          for (const stream of subtitleStreams) {
            const supportedCodecs = ['subrip', 'ass', 'mov_text'];
            if (supportedCodecs.includes(stream.codec_name)) {
              const format: 'srt' | 'ass' = stream.codec_name === 'ass' ? 'ass' : 'srt';
              // 提取字幕内容
              const content = await readSubtitleContent(filePath, stream.index, format);
              subtitles.push({
                content,
                format,
                index: stream.index,
                filePath,
                language: stream.tags?.language,
                title: stream.tags?.handler_name
              });
            }
          }

          resolve(subtitles);
        } catch (error) {
          reject(new Error(`解析字幕信息失败: ${(error as Error).message}`));
        }
      } else {
        reject(new Error(`ffprobe进程退出，错误码 ${code}: ${stderr}`));
      }
    });
  });
}

/**
 * 从视频文件中提取指定字幕流的内容
 * @param filePath 视频文件路径
 * @param streamIndex 字幕流索引
 * @param format 字幕格式
 * @returns 字幕内容
 */
async function readSubtitleContent(filePath: string, streamIndex: number, format: 'srt' | 'ass'): Promise<string> {
  return new Promise((resolve, reject) => {
    // 使用ffmpeg提取字幕内容
    const ffmpeg = spawn('ffmpeg', [
      '-i', filePath,
      '-map', `0:${streamIndex}`,
      '-f', format,
      'pipe:1'
    ]);

    let content = '';

    ffmpeg.stdout.on('data', (data) => {
      content += data.toString();
    });

    ffmpeg.stderr.on('data', (data) => {
      // console.error(`ffmpeg stderr: ${data}`);
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(content);
      } else {
        reject(new Error(`ffmpeg进程退出，错误码 ${code}`));
      }
    });
  });
}
