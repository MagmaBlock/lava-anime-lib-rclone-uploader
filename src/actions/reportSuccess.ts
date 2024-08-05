import chalk from "chalk";
import { reportUploadMessage } from "../api/reportUploadMessage";
import ora from "ora";

interface ReportDetails {
  path: string;
  fileName: string;
}

/**
 * 向服务端上报成功结果
 * @param path 到达番剧文件夹的路径
 * @param fileName 下载完成的文件名。如果下载的是文件夹，请上报文件夹名
 * @returns
 */
export async function reportSuccess(
  path: string,
  fileName: string
): Promise<void> {
  console.log("");

  const reportDetails: ReportDetails = { path, fileName };
  const reportMessage = formatReportDetails(reportDetails);

  const msgSpinner = ora(`正在推送更新消息到服务端...\n${reportMessage}\n`);
  msgSpinner.start();

  try {
    await reportUploadMessage(path, fileName);
    msgSpinner.succeed(`推送更新消息到服务端完成.\n${reportMessage}\n`);
  } catch (error) {
    console.error(error);
    msgSpinner.text = "向服务端推送消息失败...  将在 120 秒后重试";
    setTimeout(() => reportSuccess(path, fileName), 120 * 1000);
  }
}

function formatReportDetails(details: ReportDetails): string {
  return chalk.gray(
    `上报内容:\n路径: ${details.path}\n文件名: ${details.fileName}`
  );
}
