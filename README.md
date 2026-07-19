# Overlayer

A notes canvas and text highlighter for any website — fully offline.

Overlayer gives every site its own sheet of quick notes and lets you highlight text directly on the page. Nothing is uploaded anywhere: all your notes live in your browser, on your device.

## Features

- **Quick notes per site** — open a sheet on any website and drop in rich text, sticky notes, link buttons, and images. Drag images straight from your computer or from another page.
- **Multiple pages** — each site can hold several note pages, each with its own title.
- **Text highlighter** — select text on a page and highlight it. Change color and style, attach a note, and jump back to it later.
- **Finds your highlights again** — highlights survive page reloads and are restored on dynamic sites. On long feeds the extension can keep scrolling and loading older content until it finds the text.
- **Saved notes manager** — browse everything you have across all sites, with search by site or by highlighted text.
- **Three themes** — Green, Blue, and Space.
- **Fully offline** — no servers, no accounts, no analytics, no telemetry.

## Installation

Overlayer is not published to the extension stores yet. To try it now, build it from source and load the unpacked build:

**Chrome / Edge**

1. `npm install && npm run build`
2. Open `chrome://extensions`, enable **Developer mode**
3. Choose **Load unpacked** and select `.output/chrome-mv3`

**Firefox**

1. `npm install && npm run build:firefox`
2. Open `about:debugging#/runtime/this-firefox`
3. Choose **Load Temporary Add-on** and select any file inside `.output/firefox-mv2`

## Development

Requires Node.js 22 or newer.

```bash
npm install          # install dependencies
npm run dev          # Chrome with hot reload
npm run dev:firefox  # Firefox with hot reload
npm run check        # types, lint, and tests
npm run build        # production build (also :edge, :firefox)
npm run zip          # packaged archive for store submission
```

Code quality is enforced by TypeScript in strict mode, ESLint, Prettier, and Vitest, plus a Qodana scan on every push.

## Tech stack

Built with [WXT](https://wxt.dev) (Chrome and Edge on Manifest V3, Firefox on Manifest V2), React 19, TypeScript, and Tailwind CSS 4. Rich text is powered by TipTap, and the interface uses Radix UI primitives with Lucide icons.

The three surfaces — popup, settings page, and the in-page interface — are documented alongside the storage model and the highlight-anchoring approach in the source. The in-page UI is mounted inside shadow roots so that website styles and extension styles never collide.

## Supported languages

English, Russian, Spanish, German, French, Portuguese, Japanese, and Simplified Chinese. The interface follows your browser language by default and can be changed in settings.

## Your data

Everything is stored locally in your browser and never leaves your device. You can export all notes and settings to a JSON file at any time from **Settings → Data**, and import them back on another device.

See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Contributing

Bug reports and suggestions are welcome in [issues](https://github.com/Iliiasik/Overlayer/issues). If you send a pull request, please make sure `npm run check` passes.

## License

Licensed under the GNU General Public License v3.0 or later. See [LICENSE](LICENSE).

Created by Iliias Baiyshev.
