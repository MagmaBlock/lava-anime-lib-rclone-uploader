import axios from "axios";
import axiosRetry from "axios-retry";
import chalk from "chalk";
import { Command } from "commander";
import dayjs from "dayjs";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ora from "ora";
import { reportSuccess } from "./actions/reportSuccess";
import { config } from "./tools/config";

// 配置 axios 重试
axiosRetry(axios, {
  retries: 5,
  retryDelay: (retryCount) => 1000 * Math.pow(2, retryCount),
});

interface UploadTask {
  fromPath: string;
  destPath: string;
  drive: string;
}

interface CLIOptions {
  name: string;
  filePath: string;
  savePath: string;
}

const scriptPath = path.dirname(fileURLToPath(import.meta.url));
const taskID = dayjs().format("YYYYMMDD_HHmmssSSS");

const program = new Command();

program
  .name("lava-anime-lib-rclone-uploader")
  .option("--name <name>", "文件名")
  .option("--filePath <filePath>", "文件路径")
  .option("--savePath <savePath>", "保存路径")
  .parse(process.argv);

const options = program.opts() as CLIOptions;

if (!options.name || !options.filePath || !options.savePath) {
  program.help();
  process.exit(1);
}

function logTaskInfo(options: CLIOptions): void {
  console.log("\n以下为本次脚本传入的参数:");
  console.log(chalk.gray(JSON.stringify(options, null, 2)));
  console.log("\n若想要再次运行本任务，可以使用以下指令");
  console.log(chalk.gray(generateReRunCommand(options)));
  console.log("\n");
}

function generateReRunCommand(options: CLIOptions): string {
  return `lava-anime-lib-rclone-uploader ${Object.entries(options)
    .map(([key, value]) => `--${key} "${value}"`)
    .join(" ")}`;
}

function parsePathInfo(
  filePath: string,
  savePath: string
): {
  inLibPath: string[];
  bgmID: string | null;
  animeTitle: string;
} {
  const savePathArray = savePath.split(path.sep);
  const saveDirName = path.basename(savePath);
  const bgmID = saveDirName.match(/\d+$/)?.[0] ?? null;
  const animeTitle = saveDirName.replace(bgmID ?? "", "");

  const rootIndex = savePathArray.findIndex(
    (pathSection) => pathSection === "LavaAnimeLib"
  );
  if (rootIndex === -1) {
    throw new Error("下载目录中不含 LavaAnimeLib");
  }
  const inLibPath = savePathArray.slice(rootIndex);

  return { inLibPath, bgmID, animeTitle };
}

function createUploadTasks(
  filePath: string,
  inLibPath: string[],
  destDrive: string[]
): UploadTask[] {
  return destDrive.map((drive) => ({
    fromPath: filePath,
    destPath: path.posix.join(drive, ...inLibPath),
    drive,
  }));
}

async function runUploadTask(task: UploadTask): Promise<void> {
  const rcloneCommand = `rclone copy "${task.fromPath}" "${task.destPath}" -P --local-encoding None --onedrive-encoding None`;
  console.log(
    "\n" + chalk.green("开始运行"),
    chalk.gray.underline(rcloneCommand)
  );

  return new Promise((resolve, reject) => {
    const rcloneProcess = spawn(rcloneCommand, { shell: true });
    const spinner = ora(`正在执行 RClone 上传...`).start();
    spinner.prefixText = chalk.blueBright(`[任务 ${task.drive}]`);

    rcloneProcess.stdout.on("data", (data) => {
      const progress =
        data.toString().match(/\d{1,3}(\.\d{1,2}){0,1}%/)?.[0] ?? "0%";
      spinner.text = `正在执行 RClone 上传: ${chalk.whiteBright.bgBlueBright(
        ` ${progress} `
      )}\n${data.toString()}`;
    });

    rcloneProcess.stderr.on("data", (data) => {
      spinner.fail(chalk.red("Rclone 错误, 输出: \n") + data.toString());
      reject(new Error(data.toString()));
    });

    rcloneProcess.on("close", (code) => {
      if (code !== 0) {
        spinner.warn(chalk.yellow(`Rclone 进程非成功退出，退出码: ${code}`));
        reject(new Error(`Rclone process exited with code ${code}`));
      } else {
        spinner.succeed("Rclone 进程正常退出");
        resolve();
      }
    });
  });
}

async function handleUploadFailures(
  failedTasks: UploadTask[],
  allTasks: UploadTask[]
): Promise<void> {
  console.log(chalk.red("\n\n\n\n[发生失败, 准备对失败的文件进行重传...]"));

  const retryFails: UploadTask[] = [];

  for (const task of failedTasks) {
    console.log(chalk.yellow("尝试重传:", chalk.gray(task.destPath)));
    try {
      await runUploadTask(task);
    } catch (error) {
      retryFails.push(task);
    }
  }

  if (retryFails.length) {
    console.error(chalk.bgRed.white(" 重试上传后仍有失败任务! "));
    const failsDir = path.join(scriptPath, "fails");
    if (!existsSync(failsDir)) {
      mkdirSync(failsDir, { recursive: true });
    }
    const failFilePath = path.join(failsDir, `${taskID}.json`);
    console.log(
      chalk.yellow("重试文件已保存到:"),
      chalk.gray.underline(failFilePath)
    );
    writeFileSync(
      failFilePath,
      JSON.stringify({
        taskID,
        reRunCommand: generateReRunCommand(options),
        uploadTasks: allTasks,
        uploadFails: retryFails,
      })
    );
    console.error(chalk.red(`上传重试失败! 请检查任务 ${taskID} 并及时重传`));
  } else {
    await reportSuccess(options.savePath, options.name);
  }
}

async function main() {
  logTaskInfo(options);

  const { inLibPath } = parsePathInfo(options.filePath, options.savePath);
  const uploadTasks = createUploadTasks(
    options.filePath,
    inLibPath,
    config.rcloneDestinations
  );

  const failedTasks: UploadTask[] = [];

  for (const task of uploadTasks) {
    try {
      await runUploadTask(task);
    } catch (error) {
      failedTasks.push(task);
    }
  }

  if (failedTasks.length) {
    await handleUploadFailures(failedTasks, uploadTasks);
  } else {
    await reportSuccess(options.savePath, options.name);
  }
}

main().catch((error) => {
  console.error(chalk.red("发生错误:"), error);
  process.exit(1);
});
