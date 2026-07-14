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

function hostForDomain(domain) {
  return domain.split("/")[0];
}

function originPatternsForDomain(domain) {
  const host = hostForDomain(domain);
  return [`http://${host}/*`, `https://${host}/*`];
}

async function hasHostPermission(domain) {
  return chrome.permissions.contains({ origins: originPatternsForDomain(domain) });
}

async function getSavedDomains() {
  const { domains } = await chrome.storage.local.get("domains");
  return Array.isArray(domains) ? domains : DEFAULT_DOMAINS;
}

async function updateRules(domains) {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const validDomains = [...new Set(domains.map(normaliseDomain).filter(Boolean))];
  const permissionResults = await Promise.all(validDomains.map(hasHostPermission));
  const protectedDomains = validDomains.filter((_, index) => permissionResults[index]);
  const rules = protectedDomains.map((domain, index) => makeRule(domain, RULE_ID_START + index));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRules.map((rule) => rule.id),
    addRules: rules
  });

  await chrome.storage.local.set({ domains: validDomains });
  return { domains: validDomains, protectedDomains };
}

async function initialise() {
  await updateRules(await getSavedDomains());
}

async function removeDomain(domain) {
  const normalised = normaliseDomain(domain);
  const domains = await getSavedDomains();
  const remainingDomains = normalised ? domains.filter((entry) => entry !== normalised) : domains;
  const result = await updateRules(remainingDomains);

  let accessRemoved = false;
  if (normalised) {
    const host = hostForDomain(normalised);
    const hostIsStillUsed = result.domains.some((entry) => hostForDomain(entry) === host);
    if (!hostIsStillUsed && await hasHostPermission(normalised)) {
      accessRemoved = await chrome.permissions.remove({ origins: originPatternsForDomain(normalised) });
    }
  }

  return { ...result, accessRemoved };
}

chrome.runtime.onInstalled.addListener(() => {
  initialise().catch(console.error);
});

chrome.runtime.onStartup.addListener(() => {
  initialise().catch(console.error);
});

chrome.permissions.onAdded.addListener(() => {
  initialise().catch(console.error);
});

chrome.permissions.onRemoved.addListener(() => {
  initialise().catch(console.error);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "getDomains") {
    getSavedDomains().then((domains) => sendResponse({ domains }));
    return true;
  }

  if (message.type === "getStatus") {
    getSavedDomains()
      .then(async (domains) => {
        const permissionResults = await Promise.all(domains.map(hasHostPermission));
        sendResponse({
          domains,
          protectedDomains: domains.filter((_, index) => permissionResults[index])
        });
      })
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "saveDomains") {
    updateRules(message.domains || [])
      .then(({ domains, protectedDomains }) => sendResponse({ ok: true, domains, protectedDomains }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "syncRules") {
    initialise()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "removeDomain") {
    removeDomain(message.domain)
      .then(({ domains, protectedDomains, accessRemoved }) => sendResponse({ ok: true, domains, protectedDomains, accessRemoved }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "restoreDefaults") {
    updateRules(DEFAULT_DOMAINS)
      .then(({ domains, protectedDomains }) => sendResponse({ ok: true, domains, protectedDomains }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});
