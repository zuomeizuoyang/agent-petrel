---
workflow: product-launch-video
flow: automation
storyboard: no
message: "海燕 ASCII 动态背景的真实运行效果"
length: 10
aspect: "16:9"
language: zh-CN
destination: "GitHub README / repository showcase"
angle: "show the existing project as-is"
music: none
---

## Intent

用户要求：用 HyperFrames 保存这个项目的 10 秒视频作为展示，打包发布到 GitHub，并补充借鉴 https://github.com/stackedlol/ascii-sharks。用户明确选择公开仓库。

## Material and scope

Source is the existing local Agent Petrel project and its `?view=chat` page, not a newly invented product design. Use its real Canvas engine, four petrels, day palette, tile texture, scale 1.4 and centerClear 0.9. Render the scene continuously for 10 seconds at 1920×1080 / 30fps. Use deterministic time seeking, no realtime capture clock. No voice, music, external assets or model generation are needed. Credit stackedlol/ascii-sharks visibly and in README.

## Confirmed and inferred

10 seconds, HyperFrames, GitHub publication, public visibility and attribution are explicit user instructions. 1080p, 30fps, silent output, existing chat view, repository name agent-petrel and direct export without additional storyboard gates are implementation choices based on the current project and user request to save/publish it. The user request already authorizes rendering and publication.

## Completion

Validate and inspect actual render, verify 10-second H.264 MP4, include reproducible HyperFrames source, source package and credit in a public GitHub repository. Preserve the documented limitation that native Codex background integration has not been implemented.
