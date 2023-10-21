import chalk from "chalk";
import { reportUploadMessage } from "../api/reportUploadMessage.js";
import ora from "ora";

/**
 * 执行成功操作
 * @param {String} path 到达番剧文件夹的路径
 * @param {String} fileName 下载完成的文件名。如果下载的是文件夹，请上报文件夹名
 * @returns {Promise}
 */
export async function reportSuccess(path, fileName) {
  console.log("");

  let reportDetails = chalk.gray(
    `上报内容:\n路径: ${path}\n文件名: ${fileName}`
  );

  const msgSpinner = ora(`正在推送更新消息到服务端...\n${reportDetails}\n`);
  msgSpinner.start();
  await reportUploadMessage(path, fileName);
  msgSpinner.succeed(`推送更新消息到服务端完成.\n${reportDetails}\n`);
}
