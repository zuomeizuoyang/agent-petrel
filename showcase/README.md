# 10-second HyperFrames showcase

The composition reuses the project's actual DOM, CSS and PetrelEngine. `PetrelEngine.renderAt(t)` replays a fixed-step seeded simulation, so HyperFrames can seek frames in any order without a realtime clock.

From the repository root:

```sh
npm ci
npm run build
npm run showcase:prepare
cd showcase
npm run check
npm run render -- --fps 30 --quality delivery --output ../media/agent-petrel-10s.mp4
```

`index.html` and bundled assets are checked in for convenient preview. Run `npm run showcase:prepare` after changing the app. HyperFrames CLI is pinned in this folder's package.json. GSAP's copyright notice and license link are included beside its bundled script; the local Noto Sans SC font subsets retain their OFL license. The silent demonstration preserves the project's light chat layout and credits https://github.com/stackedlol/ascii-sharks.

Rendering requires a complete FFmpeg build with the `libx264` encoder on PATH. If several FFmpeg copies are installed, check `ffmpeg -encoders` and place the supported copy first on PATH for the render command.
