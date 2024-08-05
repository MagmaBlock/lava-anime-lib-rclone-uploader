# lava-anime-lib-rclone-uploader

本程序用于在下载节点上将 qbittorrent 下载的资源通过 rclone 上传至存储节点.

**PS：这个项目目前仅作个人使用，以下内容仅作备忘。**

## 环境需求

- NodeJS：20 版本，因为是在这个环境下开发的。

* qbittorrent：需要在 `选项` - `下载` 中打开 `Torrent 完成时运行`，（最好打开 `显示控制台窗口`）并且配置如下内容：

```shell
pnpm i lava-anime-lib-rclone-uploader -g
lava-anime-lib-rclone-uploader --name "%N" --filePath "%F" --savePath "%D" --apiBase "https://api.abc.com" --referer "https://aaa.bbb" --rcloneDestinations "2AG:" --rcloneDestinations "XXX:"
```

- rclone：需要预先建立好 rclone 连接到存储节点的配置文件
