---
name: petrel
description: Open and customize the Agent Petrel ASCII storm-petrel animation in a Codex browser panel, or integrate its bundled Canvas SDK into a user-owned web interface. Use for 海燕背景 or Agent Petrel requests.
---

# Agent Petrel

This plugin bundles an offline animation and a zero-dependency Canvas SDK. Resolve paths from this SKILL.md: the plugin root is `../..`. Use absolute paths for tools; installation/cache paths differ between computers.

## Open or customize the petrels

Run `node "<plugin-root>/scripts/preview.mjs" --port 0` in a persistent terminal/exec session. Node.js 20+ is required; do not run npm install. The script prints JSON containing the actual loopback URL. Keep that process session ID so it can be stopped later.

Open the returned URL in Codex's built-in browser using `open_in_codex` when available. Otherwise open it using the available browser tool, or return a clickable URL. The default is a light chat-layout **visual demo**, without a model connection. For direct controls use `--view console`.

Optional CLI flags (each takes a value):

- `--theme day|storm|moon|dawn`, `--count 0..12`, `--speed 0..3`, `--opacity 0..1`, `--scale 0.3..2`.
- `--state idle|working|waiting|done` (visual state set by the user; not live agent telemetry).
- `--embed true` for background only; `--paused true` or `--reduced-motion true` for a static preview.

For subsequent changes reuse the existing server and update the URL query parameters, for example `?view=chat&theme=moon&count=3&speed=0.5`. Do not start another server for every adjustment. Pause/resume can also be done using the preview controls. To close, close the panel and stop only the server process session started for this request. If the process cannot persist, the self-contained `runtime/preview.html` can be opened in a normal browser directly.

## Integrate into a webpage

For changes to a user-owned web project, read [the SDK integration reference](references/integration.md). Copy the bundled SDK into that project rather than linking to this plugin's cache path. Match its theme to the page, preserve readable foreground content, and clean up the engine when the view unmounts.

## Host capability boundary

Codex plugins package skills, scripts and resources. This plugin opens a side-panel preview; it does not replace the native main chat background. Do not describe a preview or installation as successful native background replacement. Do not edit Codex binaries or installation files to achieve that effect. No API key, external service, chat-content access or network upload is needed.

Inspired by [stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks); the petrel engine is independently implemented.
