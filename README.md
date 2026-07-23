<div align="center">

<img width="128" height="128" alt="Overlayer icon" src="https://github.com/user-attachments/assets/ec12223c-faae-4903-b94e-6e27f20d15d8" />
<br />
<img width="624" height="144" alt="Overlayer" src="https://github.com/user-attachments/assets/4bff94d2-ac07-4fe9-93e9-b5ab0237e9eb" />

**A notes canvas and text highlighter for any website — fully offline.**

[![License: GPL-3.0-or-later](https://img.shields.io/badge/License-GPL--3.0--or--later-blue.svg)](LICENSE)
[![CI](https://github.com/Iliiasik/Overlayer/actions/workflows/ci.yml/badge.svg)](https://github.com/Iliiasik/Overlayer/actions/workflows/ci.yml)
![Free and open source](https://img.shields.io/badge/free%20%26%20open%20source-brightgreen)

</div>

Overlayer gives every website its own sheet of quick notes and lets you highlight text directly on the page. Everything you create stays in your browser, on your device — no servers, no accounts, no tracking.

## Showcase

<p align="center">
  <img width="100%" alt="Overlayer — highlighting text on a page" src="https://github.com/user-attachments/assets/74ed3d3c-9787-4d40-b06c-24d35938d3fa" />
  <br />
  <sub>Select text, pick a color, and attach a note — right on the page.</sub>
</p>

<p align="center">
  <img height="210" alt="Overlayer — highlights list open on a page" src="https://github.com/user-attachments/assets/2f5bf0f0-7c73-4dde-b1b8-8fe23b9c9508" />
  <img height="210" alt="Overlayer — searching a page for a highlight" src="https://github.com/user-attachments/assets/2066ce8b-6e27-4b5d-ac1c-0b56e74af170" />
  <br />
  <sub>Open the list of every highlight, or let Overlayer scroll a long feed until it finds the one you saved.</sub>
</p>

<p align="center">
  <img width="100%" alt="Overlayer — jumping to a highlight from Saved notes" src="https://github.com/user-attachments/assets/ba943d96-6aac-480b-ad35-610dd9149208" />
  <br />
  <sub>Jump straight to any highlight from the Saved notes manager.</sub>
</p>

---

<p align="center">
  <img width="100%" alt="Overlayer — quick notes sheet on a website" src="https://github.com/user-attachments/assets/da9cce5c-b9f0-4af2-8cd3-e2824a786c85" />
  <br />
  <sub>Every site gets its own sheet of quick notes — text, stickers, links, and images.</sub>
</p>

<p align="center">
  <img height="380" alt="Overlayer — rich text note on the quick notes sheet" src="https://github.com/user-attachments/assets/1e191aa3-f07a-4ebf-9268-57a04b89b9bb" />
  <img height="380" alt="Overlayer — link button on the quick notes sheet" src="https://github.com/user-attachments/assets/196d2f98-1279-4e3b-b528-5e065494f128" />
  <br />
  <sub>Rich text blocks and link buttons, placed anywhere on the sheet.</sub>
</p>

---

<p align="center">
  <img height="210" alt="Overlayer — Saved notes manager" src="https://github.com/user-attachments/assets/67518037-1e13-494a-a24c-9f273613cf07" />
  <img height="210" alt="Overlayer — expanded highlights in Saved notes" src="https://github.com/user-attachments/assets/d03bc856-d309-460c-881d-5831bc736173" />
  <br />
  <sub>Manage everything across all your sites — searchable by site or by highlighted text.</sub>
</p>

---

<p align="center">
  <img height="150" alt="Overlayer — settings in the Green theme" src="https://github.com/user-attachments/assets/95729259-3f1d-4052-9942-55aa867b1c59" />
  <img height="150" alt="Overlayer — settings in the Blue theme" src="https://github.com/user-attachments/assets/ea314d2e-1c84-4a47-ac83-63595c396bde" />
  <img height="150" alt="Overlayer — settings in the Space theme" src="https://github.com/user-attachments/assets/5c5311c4-6ca7-4718-bca8-bcf8b4ef3683" />
  <br />
  <sub>Three themes — Green, Blue, and Space.</sub>
</p>

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

<table align="center">
  <tr>
    <td>🇬🇧&nbsp;English</td>
    <td>🇷🇺&nbsp;Русский</td>
    <td>🇪🇸&nbsp;Español</td>
    <td>🇩🇪&nbsp;Deutsch</td>
  </tr>
  <tr>
    <td>🇫🇷&nbsp;Français</td>
    <td>🇵🇹&nbsp;Português</td>
    <td>🇯🇵&nbsp;日本語</td>
    <td>🇨🇳&nbsp;简体中文</td>
  </tr>
</table>

The interface follows your browser language by default and can be changed in settings.

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
