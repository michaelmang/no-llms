# Chrome Web Store submission copy

## Description

Take a deliberate break from LLM websites. No AI redirects selected AI chat services and any sites you add to a garden-inspired gallery of public-domain art with Radio Swiss Classic. Enable the default blocklist from the extension popup, add individual sites, or opt into the reviewed LLM/chat collection. Set weekday focus hours so blocking automatically pauses when you are off the clock. Chrome asks for permission only for the sites you choose to block.

## Category

Productivity

## Language

English

## Permission justification

### declarativeNetRequestWithHostAccess

Used to create local redirect rules for websites the user has explicitly approved for blocking. The rules apply only to top-level pages and frames for those selected sites and redirect them to the extension's local blocked page. The extension does not inject scripts, read page content, form data, credentials, or browsing history.

### storage

Used only to save the user's selected blocklist locally in Chrome. It persists sites approved from the default list or added in Extension Options so their local redirect rules can be rebuilt after Chrome restarts. No personal data is collected or transmitted.

### alarms

Used only to activate or pause local redirect rules at the user’s selected focus-schedule times. No browsing data is read, collected, or transmitted.

### Optional host permissions

Requested at runtime only after a user clicks Enable protection, adds a domain in Extension Options, or enables the optional curated LLM/chat collection. Each request is limited to the specific site or sites the user chose to block, plus their subdomains only when the user enables the related-subdomains setting. The curated collection is bundled and reviewed with each release; it is not fetched remotely. The extension does not request access to all websites at installation, and removes optional access when a host is no longer on the blocklist.

### Remote code

No. All extension JavaScript is packaged with the extension. The blocked page may request public-domain artwork metadata and images from museum APIs, and the radio player connects directly to Radio Swiss Classic only when the user chooses to play it.
