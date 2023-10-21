import axios from "axios";
import axiosRetry from "axios-retry";
import chalk from "chalk";
import { spawn } from "child_process";
import dayjs from "dayjs";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import inquirer from "inquirer";
import PressToContinuePrompt from "inquirer-press-to-continue";
import minimist from "minimist";
import ora from "ora";
import path, { dirname } from "path";

import { fileURLToPath } from "url";

import { reportSuccess } from "./src/actions/reportSuccess.js";
import { sendMiraiMessage } from "./src/api/sendMiraiMessage.js";
import { config } from "./src/tools/config.js";

inquirer.registerPrompt("press-to-continue", PressToContinuePrompt);

const destDrive = config.rcloneDestinations;

// meta
const scriptPath = dirname(fileURLToPath(import.meta.url));
const taskID = dayjs().format("YYYYMMDD_HHmmssSSS");
const options = minimist(process.argv);
const reRunCommand = `node "${options._[1]}" --name "${options?.name}" --filePath "${options?.filePath}" --rootPath "${options?.rootPath}" --savePath "${options?.savePath}" --fileCount "${options?.fileCount}"`;
// meta log
console.log("\n以下为本次脚本传入的参数:");
console.log(chalk.gray(JSON.stringify(options, null, 2)));
console.log("\n若想要再次运行本任务，可以使用以下指令");
console.log(chalk.gray(reRunCommand));
console.log("\n");

// storage
const uploadTasks = [];
const uploadFails = [];

// 任务分析部分
const filePathArray = options.filePath.split(path.sep); // 下载的文件或文件夹的绝对路径
const savePathArray = options.savePath.split(path.sep); // 下载时用户设定的保存父文件夹（番剧文件夹）
const saveDirName = path.basename(options.savePath); // 番剧文件夹名
const bgmID = saveDirName.match(/\d+$/); // Bangumi ID
const animeTitle = saveDirName.replace(bgmID, ""); // Title

// LavaAnimeLib 文件夹所在的索引
const rootIndex = savePathArray.findIndex(
  (pathSection) => pathSection == "LavaAnimeLib"
);
if (rootIndex == -1) {
  throw "下载目录中不含 LavaAnimeLib";
}
let inLibPath = [];
savePathArray.forEach((pathSection, index) => {
  if (index >= rootIndex) inLibPath.push(pathSection); // 截取 LavaAnimeLib 及其之后的路径
});

// 创建任务清单
destDrive.forEach((drive) => {
  const fromPath = path.posix.join(...filePathArray); // 下载的文件(夹)
  const destPath = path.posix.join(drive, ...inLibPath); // 目标 Drive 的路径
  uploadTasks.push({ fromPath, destPath, drive });
  console.log("创建任务上传至: ", chalk.gray(destPath));
});

// 开始上传任务
for (let task of uploadTasks) {
  try {
    await runAUploadTask(task);
  } catch (error) {
    uploadFails.push(task);
  }
}

// 第一次上传有发生失败
if (uploadFails.length) {
  console.log(chalk.red("\n\n\n\n[发生失败, 准备对失败的文件进行重传...]"));

  // 重试仍然失败的
  let retryFails = [];

  for (let task of uploadFails) {
    console.log(chalk.yellow("尝试重传:", chalk.gray(task.destPath)));
    try {
      await runAUploadTask(task);
    } catch (error) {
      retryFails.push(task);
    }
  }

  // 重试仍有失败
  if (retryFails.length) {
    console.error(chalk.bgRed.white(" 重试上传后仍有失败任务! "));

    // 检查目标文件夹是否存在，如果不存在则创建
    if (!existsSync(path.join(scriptPath, "/fails"))) {
      mkdirSync(path.join(scriptPath, "/fails"), { recursive: true });
    }
    console.log(
      chalk.yellow("重试文件已保存到:"),
      chalk.gray.underline(path.join(scriptPath, `/fails/${taskID}.json`))
    );
    writeFileSync(
      path.join(scriptPath, `/fails/${taskID}.json`),
      JSON.stringify({ taskID, reRunCommand, uploadTasks, uploadFails })
    );

    // 消息告警
    await sendMiraiMessage([
      {
        type: "Plain",
        text: `上传重试失败! 请检查任务 ${taskID} 并及时重传`,
      },
    ]);
    // 无法上传, 直接停止运行
    console.error(chalk.red(`上传重试失败! 请检查任务 ${taskID} 并及时重传`));
  }
  // 开始报喜
  else {
    await reportSuccess(options.savePath, options.name);
  }
}
// 开始报喜
else {
  await reportSuccess(options.savePath, options.name);
}

// 暂停脚本
setTimeout(() => {
  return Promise.resolve();
}, 1000 * 60 * 60);

/**
 * 进行一个 RClone 上传
 * @param {Object} task
 * @returns {Promise}
 */
async function runAUploadTask(task) {
  return new Promise((resolve, reject) => {
    const rcloneCommand = `rclone copy "${task.fromPath}" "${task.destPath}" -P --local-encoding "Slash,BackSlash,Ctl,RightSpace,RightPeriod,InvalidUtf8,Dot"`;
    console.log(
      "\n" + chalk.green("开始运行"),
      chalk.gray.underline(rcloneCommand)
    );

    const rcloneProcess = spawn(rcloneCommand, { shell: true });

    const spinner = ora(`正在执行 RClone 上传...`);
    spinner.prefixText = chalk.blueBright(`[任务 ${task.drive}]`);
    spinner.start();

    // 监听进程的输出
    rcloneProcess.stdout.on("data", (data) => {
      // 处理输出数据
      spinner.text = `正在执行 RClone 上传: ${chalk.whiteBright.bgBlueBright(
        " " +
          (data.toString().match(/\d{1,3}(\.\d{1,2}){0,1}%/)?.[0] ?? "0%") +
          " "
      )}\n${data.toString()}`;
    });

    rcloneProcess.stderr.on("data", (data) => {
      // 处理错误输出数据
      spinner.fail(chalk.red("Rclone 错误, 输出: \n") + data.toString());
      // 出错
      reject(data.toString());
    });

    rcloneProcess.on("close", (code) => {
      // 进程关闭时的处理逻辑
      if (code !== 0) {
        spinner.warn(chalk.yellow(`Rclone 进程非成功退出，退出码: ${code}`));
        // 出错
        reject(code);
      }
      spinner.succeed("Rclone 进程正常退出");
      resolve(code);
    });
  });
}

// 请求自动重试
axiosRetry(axios, {
  retries: 5,
  retryDelay: (retryCount) => {
    return 1000 * Math.pow(2, retryCount);
  },
});
