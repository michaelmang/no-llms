const DEFAULT_DOMAINS = [
  "chatgpt.com",
  "chat.openai.com",
  "claude.ai",
  "gemini.google.com",
  "aistudio.google.com",
  "copilot.microsoft.com",
  "bing.com/chat",
  "perplexity.ai",
  "poe.com",
  "grok.com",
  "x.ai",
  "mistral.ai/chat",
  "lechat.mistral.ai",
  "meta.ai",
  "character.ai",
  "you.com",
  "pi.ai",
  "deepseek.com",
  "chat.deepseek.com",
  "huggingface.co/chat"
];

const RULE_ID_START = 1;

function normaliseDomain(input) {
  const value = input.trim().toLowerCase();
  if (!value) return null;

  const withoutProtocol = value.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const hostAndPath = withoutProtocol.split(/[?#]/)[0].replace(/\/$/, "");

  // A domain may include a path (for example, bing.com/chat). Do not accept
  // wildcards or other rule syntax from the options UI.
  if (!/^[a-z0-9.-]+(?:\/[a-z0-9._~!$&'()*+,;=:@%-]+)*$/.test(hostAndPath)) {
    return null;
  }

  const [host] = hostAndPath.split("/");
  if (!host.includes(".") || host.startsWith(".") || host.endsWith(".")) return null;
  return hostAndPath;
}

function makeRule(domain, id) {
  const [host, ...pathSegments] = domain.split("/");
  const path = pathSegments.length ? `/${pathSegments.join("/")}` : "";
  return {
    id,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { extensionPath: "/blocked.html" }
    },
    condition: {
      urlFilter: `||${host}${path}`,
      resourceTypes: ["main_frame", "sub_frame"]
    }
  };
}

async function updateRules(domains) {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const validDomains = [...new Set(domains.map(normaliseDomain).filter(Boolean))];
  const rules = validDomains.map((domain, index) => makeRule(domain, RULE_ID_START + index));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRules.map((rule) => rule.id),
    addRules: rules
  });

  await chrome.storage.local.set({ domains: validDomains });
  return validDomains;
}

async function initialise() {
  const { domains } = await chrome.storage.local.get("domains");
  await updateRules(Array.isArray(domains) ? domains : DEFAULT_DOMAINS);
}

chrome.runtime.onInstalled.addListener(() => {
  initialise().catch(console.error);
});

chrome.runtime.onStartup.addListener(() => {
  initialise().catch(console.error);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "getDomains") {
    chrome.storage.local.get("domains").then(({ domains }) => {
      sendResponse({ domains: domains || DEFAULT_DOMAINS });
    });
    return true;
  }

  if (message.type === "saveDomains") {
    updateRules(message.domains || [])
      .then((domains) => sendResponse({ ok: true, domains }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "restoreDefaults") {
    updateRules(DEFAULT_DOMAINS)
      .then((domains) => sendResponse({ ok: true, domains }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});
