import { spawn } from 'node:child_process';

interface VideoInfo {
  streams: Array<{
    codec_type: string;
    codec_name: string;
    width?: number;
    height?: number;
    bit_rate?: string;
    duration?: string;
  }>;
  format: {
    filename: string;
    nb_streams: number;
    format_name: string;
    duration: string;
    size: string;
    bit_rate: string;
  };
}

export async function getVideoInfo(filePath: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
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

    ffprobe.on('close', (code) => {
      if (code === 0) {
        try {
          const videoInfo: VideoInfo = JSON.parse(stdout);
          resolve(videoInfo);
        } catch (error) {
          reject(new Error(`Failed to parse video info: ${(error as Error).message}`));
        }
      } else {
        reject(new Error(`ffprobe process exited with code ${code}: ${stderr}`));
      }
    });
  });
}

