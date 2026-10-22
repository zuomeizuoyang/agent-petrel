# Agent Petrel · Codex 插件

在 Codex 侧栏打开海燕动态背景、调节主题与鸟群，或将附带 SDK 接入自己的 agent 网页。**侧栏预览不会替换原生 Codex 的主聊天背景。**

借鉴 [stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks)，海燕引擎独立实现。MIT，无运行依赖、无需 API key；本地预览需要 Node.js 20+。

## 安装

在有插件命令的 Codex CLI 中运行：

```sh
codex plugin marketplace add zuomeizuoyang/agent-petrel
codex plugin add agent-petrel@agent-petrel
```

重新打开一个聊天，让插件技能加载。桌面端也可以在插件目录里选择 **Agent Petrel · 海燕** 来源并安装；必要时重启桌面应用。GitHub 仓库分发不代表已经上架官方公共插件目录。

离线下载发布的插件 ZIP，解压后，在解压目录执行 `codex plugin marketplace add .`，再运行同一条 `codex plugin add` 命令。ZIP 保留 `.agents/plugins/marketplace.json` 和 `plugins/agent-petrel/`，不能只解压 SKILL.md。

## 使用

安装后发送：

- “用海燕插件打开动态背景。”
- “把海燕改成月光银，3 只，速度 0.5。”
- “把海燕动态背景接入当前网页。”

也可显式选择 `petrel` 技能。四种主题 day / storm / moon / dawn；控制台可以暂停、调整数量和速度、导出 JSON。预览的聊天输入区用于观察可读性，没有连接聊天模型。

不经过插件也能运行：`node plugins/agent-petrel/scripts/preview.mjs --port 0 --view console`。打开输出的本地 URL，Ctrl+C 停止。只有本机能访问，服务器只提供三个内置资源及健康检查，不提供文件浏览或写入接口。

## 更新与卸载

```sh
codex plugin marketplace upgrade agent-petrel
codex plugin add agent-petrel@agent-petrel
codex plugin remove agent-petrel@agent-petrel
```

具体命令以已安装 CLI 的 `--help` 为准。卸载插件前关闭预览面板并停止启动它的终端进程；没有常驻开机服务。
