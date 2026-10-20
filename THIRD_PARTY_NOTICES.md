# Acknowledgements and third-party notices

## Visual inspiration

**借鉴 / Inspired by [stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks)**, inspected at commit `c521e24a787e6d4cc460d4cf2b9815f25e4fe453`.

The reference demonstrates ASCII animals on a Canvas with a particle environment. This project independently implements storm-petrel geometry, flight, wing articulation, lifecycle management, the web component and adapters. It does not redistribute the reference repository's source. We did not find a LICENSE file in that inspected revision; this project's MIT license applies to its own implementation.

The light chat layout is also informed by [LerneKImitk's demonstration](https://x.com/LerneKImitk/status/2112502617704427806).

## Video tooling

- [HyperFrames](https://hyperframes.heygen.com/) renders the reproducible 10-second showcase. Its CLI version is pinned in `showcase/package.json`.
- [GSAP](https://gsap.com/) 3.14.2 drives the paused video timeline. The bundled `showcase/assets/gsap.min.js` retains its original copyright header; see `showcase/assets/GSAP-NOTICE.txt` and the linked standard license.
- Noto Sans SC fonts are distributed under the SIL Open Font License 1.1. Selected unmodified WOFF2 subsets come from `@fontsource/noto-sans-sc` 5.2.8; the original license is included at `showcase/assets/fonts/OFL-LICENSE.txt`.

The root MIT license does not replace any third-party license. Development dependencies retain their respective licenses as recorded in their package metadata and lockfile.
