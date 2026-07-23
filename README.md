# No LLM Sites

No LLM Sites redirects selected AI-chat websites to a gallery of public-domain art with Radio Swiss Classic.

## Features

- **Focus schedule:** Block only during the weekdays and hours you choose, using your computer’s local time.
- **LLM/chat collection:** Opt into a reviewed, versioned collection of additional LLM/chat sites maintained through community contributions to the project. The collection is bundled with each release, never fetched remotely.
- **Related subdomains:** Choose whether a selected domain also blocks its subdomains.

## Permissions

The extension does not request access to every website at installation. Click **Enable protection** in the extension popup to approve the default blocklist, add a domain in Extension Options to approve that individual site, or explicitly enable the optional LLM/chat collection. Chrome displays its normal permission prompt before any selected group of sites is blocked. Removing the final blocklist entry for a host also removes the extension's optional access to that host.

Your custom blocklist is stored locally in Chrome. The extension does not read page content, browsing history, form entries, or credentials.

A Chrome/Chromium extension that blocks known LLM web apps and domains you choose.

## Install locally

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Select **Load unpacked** and choose this folder.
4. Open the extension's **Details** page, then **Extension options** to edit the blocklist.

The extension uses Chrome's Declarative Net Request API to redirect blocked pages to a gallery. It mixes public-domain works from the Art Institute of Chicago and The Metropolitan Museum of Art, while a bundled collection fills in automatically if either source is unavailable. Radio Swiss Classic is available in the page player. It includes ChatGPT, Claude, Gemini, Copilot, Perplexity, Poe, Grok, DeepSeek, and other common services by default.

## Scope

This is a browser-level blocker: someone with access to Chrome can disable or remove the extension. For an enforced restriction, install it with enterprise Chrome policies and prevent extension changes, or enforce the block at the DNS/firewall level.
