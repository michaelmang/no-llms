import { CURATED_LLM_CHAT_DOMAINS, DEFAULT_DOMAINS } from "./blocklist.js";

const RULE_ID_START = 1;
const SCHEDULE_ALARM = "schedule-transition";
const DEFAULT_SCHEDULE = {
  enabled: false,
  days: [1, 2, 3, 4, 5],
  start: "09:00",
  end: "17:00"
};

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

function makeRule(domain, id, includeSubdomains) {
  const [host, ...pathSegments] = domain.split("/");
  const path = pathSegments.length ? `/${pathSegments.join("/")}` : "";
  const condition = includeSubdomains
    ? { urlFilter: path ? `||${host}${path}^` : `||${host}/` }
    : { regexFilter: exactHostPattern(host, path) };

  return {
    id,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { extensionPath: "/blocked.html" }
    },
    condition: {
      ...condition,
      resourceTypes: ["main_frame", "sub_frame"]
    }
  };
}

function exactHostPattern(host, path) {
  const escapedHost = host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pathPattern = escapedPath ? `${escapedPath}(?:[/?#]|$)` : "(?:[/?#]|$)";
  return `^https?://${escapedHost}(?::\\d+)?${pathPattern}`;
}

function hostForDomain(domain) {
  return domain.split("/")[0];
}

function originPatternsForDomain(domain, includeSubdomains = false) {
  const host = hostForDomain(domain);
  const origins = [`http://${host}/*`, `https://${host}/*`];
  if (includeSubdomains) origins.push(`http://*.${host}/*`, `https://*.${host}/*`);
  return origins;
}

async function hasHostPermission(domain, includeSubdomains = false) {
  return chrome.permissions.contains({ origins: originPatternsForDomain(domain, includeSubdomains) });
}

function normaliseSchedule(schedule) {
  const days = Array.isArray(schedule?.days)
    ? [...new Set(schedule.days.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))]
    : DEFAULT_SCHEDULE.days;
  const validTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || "");
  return {
    enabled: Boolean(schedule?.enabled),
    days,
    start: validTime(schedule?.start) ? schedule.start : DEFAULT_SCHEDULE.start,
    end: validTime(schedule?.end) ? schedule.end : DEFAULT_SCHEDULE.end
  };
}

function minutesSinceMidnight(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function isScheduleActive(schedule, now = new Date()) {
  if (!schedule.enabled) return true;
  if (!schedule.days.length) return false;

  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = minutesSinceMidnight(schedule.start);
  const end = minutesSinceMidnight(schedule.end);

  if (start === end) return schedule.days.includes(currentDay);
  if (start < end) {
    return schedule.days.includes(currentDay) && currentMinutes >= start && currentMinutes < end;
  }

  if (currentMinutes >= start) return schedule.days.includes(currentDay);
  const previousDay = (currentDay + 6) % 7;
  return currentMinutes < end && schedule.days.includes(previousDay);
}

function uniqueDomains(domains) {
  return [...new Set(domains.map(normaliseDomain).filter(Boolean))];
}

function domainsForSettings(settings) {
  return uniqueDomains([
    ...settings.userDomains,
    ...(settings.curatedEnabled ? CURATED_LLM_CHAT_DOMAINS : [])
  ]);
}

async function getSettings() {
  const stored = await chrome.storage.local.get(["domains", "schedule", "curatedEnabled", "includeSubdomains"]);
  return {
    userDomains: uniqueDomains(Array.isArray(stored.domains) ? stored.domains : DEFAULT_DOMAINS),
    schedule: normaliseSchedule(stored.schedule),
    curatedEnabled: Boolean(stored.curatedEnabled),
    includeSubdomains: stored.includeSubdomains !== false
  };
}

async function setScheduleAlarm(schedule) {
  if (!schedule.enabled) {
    await chrome.alarms.clear(SCHEDULE_ALARM);
    return;
  }

  await chrome.alarms.create(SCHEDULE_ALARM, { periodInMinutes: 1 });
}

async function updateRules(settings) {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const domains = domainsForSettings(settings);
  const permissionResults = await Promise.all(domains.map((domain) => hasHostPermission(domain, settings.includeSubdomains)));
  const approvedDomains = domains.filter((_, index) => permissionResults[index]);
  const scheduleActive = isScheduleActive(settings.schedule);
  const blockedDomains = scheduleActive ? approvedDomains : [];
  const rules = blockedDomains.map((domain, index) => makeRule(domain, RULE_ID_START + index, settings.includeSubdomains));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRules.map((rule) => rule.id),
    addRules: rules
  });

  await chrome.storage.local.set({
    domains: settings.userDomains,
    schedule: settings.schedule,
    curatedEnabled: settings.curatedEnabled,
    includeSubdomains: settings.includeSubdomains
  });
  await setScheduleAlarm(settings.schedule);
  return { domains, approvedDomains, blockedDomains, scheduleActive };
}

async function initialise() {
  await updateRules(await getSettings());
}

async function removeUnusedPermissions(previousSettings, nextSettings) {
  const nextHosts = new Set(domainsForSettings(nextSettings).map(hostForDomain));
  const removableHosts = [...new Set(domainsForSettings(previousSettings).map(hostForDomain))]
    .filter((host) => !nextHosts.has(host));
  let removed = 0;

  for (const host of removableHosts) {
    if (await hasHostPermission(host)) {
      if (await chrome.permissions.remove({ origins: originPatternsForDomain(host, true) })) removed += 1;
    }
  }

  return removed;
}

async function saveSettings(nextSettings) {
  const previousSettings = await getSettings();
  const result = await updateRules(nextSettings);
  if (previousSettings.includeSubdomains && !nextSettings.includeSubdomains) {
    for (const domain of domainsForSettings(nextSettings)) {
      const wildcardOrigins = originPatternsForDomain(domain, true).filter((origin) => origin.includes("*."));
      if (await chrome.permissions.contains({ origins: wildcardOrigins })) {
        await chrome.permissions.remove({ origins: wildcardOrigins });
      }
    }
  }
  const removedPermissions = await removeUnusedPermissions(previousSettings, nextSettings);
  return { ...result, removedPermissions };
}

async function removeDomain(domain) {
  const normalised = normaliseDomain(domain);
  const settings = await getSettings();
  const nextSettings = {
    ...settings,
    userDomains: normalised ? settings.userDomains.filter((entry) => entry !== normalised) : settings.userDomains
  };
  const result = await saveSettings(nextSettings);
  return { ...result, accessRemoved: result.removedPermissions > 0 };
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

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SCHEDULE_ALARM) initialise().catch(console.error);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "getDomains") {
    getSettings().then((settings) => sendResponse({ domains: settings.userDomains }));
    return true;
  }

  if (message.type === "getSettings") {
    getSettings().then((settings) => {
      sendResponse({
        ...settings,
        domains: domainsForSettings(settings),
        curatedDomains: CURATED_LLM_CHAT_DOMAINS
      });
    });
    return true;
  }

  if (message.type === "getStatus") {
    getSettings()
      .then(async (settings) => {
        const domains = domainsForSettings(settings);
        const permissionResults = await Promise.all(domains.map((domain) => hasHostPermission(domain, settings.includeSubdomains)));
        const approvedDomains = domains.filter((_, index) => permissionResults[index]);
        const scheduleActive = isScheduleActive(settings.schedule);
        sendResponse({
          domains,
          approvedDomains,
          blockedDomains: scheduleActive ? approvedDomains : [],
          schedule: settings.schedule,
          scheduleActive,
          includeSubdomains: settings.includeSubdomains
        });
      })
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "saveDomains") {
    getSettings()
      .then((settings) => saveSettings({ ...settings, userDomains: uniqueDomains(message.domains || []) }))
      .then((result) => sendResponse({ ok: true, domains: result.domains }))
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
      .then(({ domains, accessRemoved }) => sendResponse({ ok: true, domains, accessRemoved }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "restoreDefaults") {
    getSettings()
      .then((settings) => saveSettings({ ...settings, userDomains: DEFAULT_DOMAINS }))
      .then((result) => sendResponse({ ok: true, domains: result.domains }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "saveSchedule") {
    getSettings()
      .then((settings) => saveSettings({ ...settings, schedule: normaliseSchedule(message.schedule) }))
      .then((result) => sendResponse({ ok: true, scheduleActive: result.scheduleActive }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "setCuratedEnabled") {
    getSettings()
      .then((settings) => saveSettings({ ...settings, curatedEnabled: Boolean(message.enabled) }))
      .then((result) => sendResponse({ ok: true, domains: result.domains, removedPermissions: result.removedPermissions }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "setIncludeSubdomains") {
    getSettings()
      .then((settings) => saveSettings({ ...settings, includeSubdomains: Boolean(message.enabled) }))
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});
