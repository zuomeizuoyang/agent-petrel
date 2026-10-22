# 本次验证

日期：2026-10-20（原动画与视频）；2026-10-22（Codex 插件）。环境：Windows，Node.js v24.14.0，本机 Microsoft Edge，Playwright。

## v0.2.0 插件验证

- `npm run build` 通过：同时生成 portable `plugin.json`、兼容 `.codex-plugin/plugin.json`、离线 HTML、两种 SDK 和许可证；插件资源已随 Git 仓库提交，使用者无需编译。
- `npm test`：3 项 Node 集成测试和 9 项 Playwright 测试全部通过。新增覆盖随机端口启动、从不同工作目录启动、实际内置 HTML/SDK、拒绝无关文件/写操作/非本机 Host、参数验证、主题数量调整、暂停和零外部请求。
- `quick_validate.py`：插件的 `petrel` 技能通过 frontmatter 与结构校验。
- Codex CLI 0.146.0 可解析 marketplace、安装本插件；侧栏播放由插件内置本地服务器提供。安装成功不代表原生聊天背景已经被替换。

## 原动画验证

`npm run build`：通过 TypeScript 严格检查，生成 Vite 页面、自包含离线 HTML、ES / IIFE SDK、类型声明和 MV3 扩展目录。新增确定性视频定位接口后，IIFE SDK 约 12.30 kB，gzip 约 4.77 kB。

Playwright 8 组端到端测试：

1. Canvas 连续绘制，两个时刻的画面不同；数量、配色、暂停恢复、纯背景开关和文本输入正常。
2. 自包含 HTML 通过 `file://` 打开后持续绘制；没有任何 HTTP(S) 请求；导出配置文件名正确。
3. 编译后的扩展脚本能创建、移除装饰层；`pointer-events:none`；底下输入框正常。
4. 系统减少动态偏好显示静态帧；数量上限正确；移除属性恢复默认；390px 移动布局可用；卸载后停止 RAF。
5. SDK 重复挂载只创建一个组件；组件不接管鼠标。
6. 在 1062×1292 的高窄侧栏中模拟飞行十分钟，所有海燕坐标保持有限值并在窗口边界范围内。
7. 参考视频布局采用浅色、大幅字符方块海燕及中央留白，输入正常；390px 移动视口可见输入区；能返回控制台和切换深色。
8. `renderAt(4)` 与跳转到第 8 秒、第 1 秒后再次回到第 4 秒的 Canvas 图像完全一致，第 8 秒的图像不同，且实时动画已暂停。测试直接比较 Canvas 像素，排除叠加 DOM 的字体与光标等浏览器合成差异。

第 3 项也验证了浅色宿主上的 `day` 主题和 `multiply` 混合模式。参考布局截图为 `reference-preview.png` 和 `reference-mobile.png`，已经人工查看。

桌面和移动端截图已经人工查看，保存为 `preview.png` 和 `mobile.png`。Codex 内置浏览器也已打开 `http://127.0.0.1:4187/`，确认可见海燕、控制台和正常页面，浏览器未记录错误。

未验证：真实第三方 agent 网页逐站兼容、扩展商店发布、其他操作系统、原生客户端主界面背景替换。没有将本地脚本注入测试描述成扩展已安装到用户浏览器，也没有将预览描述成 Codex 主界面已经换肤。

## HyperFrames 展示视频

- CLI：HyperFrames 0.8.181。
- `check --snapshots --json`：通过；lint、runtime、layout、contrast 均为 0 errors / 0 warnings，50/50 文本对比度检查通过。
- 成片：`media/agent-petrel-10s.mp4`，H.264 / yuv420p，1920×1080，30fps，300 帧，精确时长 10.000000 秒，无音轨，3,666,299 字节。
- 渲染路径：screenshot capture，hardware GPU；HyperFrames 报告耗时 26.7 秒。
- 人工核对了成片逐秒联系表和第 5 秒全分辨率画面，海燕持续飞行，中文及借鉴说明可读。
- README 动图从该 MP4 转换而来，720×405、15fps；海燕源码、视频工程与第三方许可说明均随仓库保留。
- 环境：最终使用带 `libx264` 及 `setparams` 的完整 FFmpeg 构建；系统中仅带部分功能的 FFmpeg 不适合本工程的最终编码。
