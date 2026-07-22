# Privacy Policy

**Extension:** Overlayer
**Last updated:** 19 July 2026

## Summary

Overlayer does not collect, transmit, sell, or share any personal data. There are no servers, no accounts, no analytics, and no telemetry. Everything you create stays on your own device.

## What data the extension stores

Overlayer stores the following locally in your browser, using the standard extension storage API (`storage.local`):

- **Quick notes** — text, sticky notes, link buttons, and images you add, grouped by website domain, together with the page titles you type.
- **Highlights** — the text you highlight, its color and style, any note you attach to it, and enough surrounding text to find the highlight again on that page.
- **Settings** — interface language, theme, and the toggles for the floating buttons and context menu.

This data never leaves your device. It is not sent anywhere, and the author has no access to it.

## Network requests

Overlayer works fully offline with one exception: if you drag an image into your notes **using its web address**, the extension downloads that image from the website hosting it, so it can be stored in your notes. This request goes directly from your browser to that website, exactly as if you had opened the image yourself. No request is sent to the author or any third party.

Site icons shown in the saved notes manager are provided by your browser's own local icon cache and are not fetched by the extension.

## Permissions and why they are needed

- **storage, unlimitedStorage** — to save your notes and highlights on your device. The larger allowance exists because notes can contain images.
- **activeTab, scripting** — to display the notes sheet and highlights on the page you are currently viewing.
- **contextMenus** — to add the "Highlight" and "Notes" items to the right-click menu.
- **favicon** — to show site icons in the saved notes manager.
- **Access to all websites** — Overlayer must be able to work on whichever site you choose to take notes on. It reads and modifies page content only to display your own notes and to restore your own highlights. It does not read, collect, or transmit page content for any other purpose.

## Deleting your data

You can delete everything at any time in **Settings → Data → Delete all**. Individual notes and highlights can be deleted separately. Uninstalling the extension also removes all stored data.

## Data portability

**Settings → Data → Export** saves all your notes and settings to a JSON file on your device. This file is created locally and is not uploaded anywhere. Use **Import** to restore it, including on another device.

## Children's privacy

Overlayer does not collect any data from anyone, including children.

## Changes to this policy

If this policy changes, the updated version will be published in this repository with a new date at the top.

## Contact

Questions or concerns: https://github.com/Iliiasik/Overlayer/issues
