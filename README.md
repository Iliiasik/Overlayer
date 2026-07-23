<div align="center">

[IMAGE]
<!-- logo / banner — centered, ~ 600px wide -->

# Overlayer

**A notes canvas and text highlighter for any website — fully offline.**

[![License: GPL-3.0-or-later](https://img.shields.io/badge/License-GPL--3.0--or--later-blue.svg)](LICENSE)
[![CI](https://github.com/Iliiasik/Overlayer/actions/workflows/ci.yml/badge.svg)](https://github.com/Iliiasik/Overlayer/actions/workflows/ci.yml)
![Free and open source](https://img.shields.io/badge/free%20%26%20open%20source-brightgreen)

</div>

Overlayer gives every website its own sheet of quick notes and lets you highlight text directly on the page. Everything you create stays in your browser, on your device — no servers, no accounts, no tracking.

## Showcase

[GIF]
<!-- suggestion: select text on a long feed, then jump back to it from the highlights list -->

[IMAGE]
<!-- suggestion: the quick notes sheet open on a real website -->

[IMAGE]
<!-- suggestion: the saved notes manager with the Sites / Notes / Text tabs -->

## Features

- **Quick notes per site** — open a sheet on any website and drop in rich text, sticky notes, link buttons, and images. Drag images straight from your computer or from another page.
- **Multiple pages** — each site can hold several note pages, each with its own title.
- **Text highlighter** — select text on a page and highlight it. Change color and style, attach a note, and jump back to it later.
- **Finds your highlights again** — highlights survive page reloads and are restored on dynamic sites. On long feeds the extension can keep scrolling and loading older content until it finds the text.
- **Saved notes manager** — browse everything you have across all sites, with search by site or by highlighted text.
- **Backup & restore** — export all notes and settings to a JSON file and import them on another device.
- **Three themes** — Green, Blue, and Space.

## Why Overlayer

- **Fully offline** — no servers, no accounts, no analytics, no telemetry.
- **Private by design** — your notes never leave your device. Read the [privacy policy](PRIVACY.md).
- **Free and open source** — GPL-3.0, no paid tiers, no ads, nothing locked behind a licence.
- **Every Chromium browser** — Chrome, Edge, Opera, Brave, Vivaldi, and more.

## Installation

<!-- After publishing, replace the note below with store badges:
[![Chrome Web Store]([IMAGE])](STORE_URL)  [![Edge Add-ons]([IMAGE])](STORE_URL)
-->

> **Not on the extension stores yet** — store links will appear here once published.

Until then, build from source and load the unpacked build:

**Chrome / Edge** (and other Chromium browsers such as Opera, Brave, and Vivaldi)

1. `npm install && npm run build`
2. Open `chrome://extensions` and enable **Developer mode**
3. Choose **Load unpacked** and select `.output/chrome-mv3`

## Supported languages

English, Russian, Spanish, German, French, Portuguese, Japanese, and Simplified Chinese. The interface follows your browser language by default and can be changed in settings.

## Development

Requires Node.js 22 or newer.

```bash
npm install          # install dependencies
npm run dev          # Chrome with hot reload
npm run check        # types, lint, and tests
npm run build        # production build (also :edge)
npm run zip          # packaged archive for store submission
```

Code quality is enforced by TypeScript in strict mode, ESLint, Prettier, and Vitest, plus a Qodana scan on every push.

## Tech stack

Built with [WXT](https://wxt.dev) on Manifest V3 for Chromium browsers, React 19, TypeScript, and Tailwind CSS 4. Rich text is powered by TipTap, and the interface uses Radix UI primitives with Lucide icons.

The three surfaces — popup, settings page, and the in-page interface — are documented alongside the storage model and the highlight-anchoring approach in the source. The in-page UI is mounted inside shadow roots so that website styles and extension styles never collide.

## Contributing

Bug reports and suggestions are welcome in [issues](https://github.com/Iliiasik/Overlayer/issues). If you send a pull request, please make sure `npm run check` passes.

## License

Licensed under the GNU General Public License v3.0 or later. See [LICENSE](LICENSE).

Created by Iliias Baiyshev.
