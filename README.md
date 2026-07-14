# No LLM Sites

A Chrome/Chromium extension that blocks known LLM web apps and domains you choose.

## Install locally

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Select **Load unpacked** and choose this folder.
4. Open the extension's **Details** page, then **Extension options** to edit the blocklist.

The extension uses Chrome's Declarative Net Request API to redirect blocked pages to a gallery. It mixes public-domain works from the Art Institute of Chicago and The Metropolitan Museum of Art, while a bundled collection fills in automatically if either source is unavailable. Radio Swiss Classic is available in the page player. It includes ChatGPT, Claude, Gemini, Copilot, Perplexity, Poe, Grok, DeepSeek, and other common services by default.

## Scope

This is a browser-level blocker: someone with access to Chrome can disable or remove the extension. For an enforced restriction, install it with enterprise Chrome policies and prevent extension changes, or enforce the block at the DNS/firewall level.
