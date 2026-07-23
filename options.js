import { CURATED_LLM_CHAT_DOMAINS, DEFAULT_DOMAINS } from "./blocklist.js";

const form = document.querySelector("#add-form");
const input = document.querySelector("#domain");
const error = document.querySelector("#form-error");
const list = document.querySelector("#domain-list");
const status = document.querySelector("#save-status");
const restoreButton = document.querySelector("#restore-defaults");
const scheduleEnabled = document.querySelector("#schedule-enabled");
const scheduleControls = document.querySelector("#schedule-controls");
const scheduleStart = document.querySelector("#schedule-start");
const scheduleEnd = document.querySelector("#schedule-end");
const scheduleDays = [...document.querySelectorAll('input[name="schedule-day"]')];
const curatedEnabled = document.querySelector("#curated-enabled");
const curatedDescription = document.querySelector("#curated-description");
const includeSubdomains = document.querySelector("#include-subdomains");

let domains = [];

function isValidDomain(value) {
  const normalised = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[?#]/)[0].replace(/\/$/, "");
  return /^[a-z0-9.-]+(?:\/[a-z0-9._~!$&'()*+,;=:@%-]+)*$/.test(normalised) && normalised.split("/")[0].includes(".");
}

function normalise(value) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[?#]/)[0].replace(/\/$/, "");
}

function originPatternsForDomain(domain, includeSubdomains = false) {
  const host = domain.split("/")[0];
  const origins = [`http://${host}/*`, `https://${host}/*`];
  if (includeSubdomains) origins.push(`http://*.${host}/*`, `https://*.${host}/*`);
  return origins;
}

function currentSchedule() {
  return {
    enabled: scheduleEnabled.checked,
    start: scheduleStart.value,
    end: scheduleEnd.value,
    days: scheduleDays.filter((input) => input.checked).map((input) => Number(input.value))
  };
}

function renderSchedule(schedule) {
  scheduleEnabled.checked = schedule.enabled;
  scheduleControls.hidden = !schedule.enabled;
  scheduleStart.value = schedule.start;
  scheduleEnd.value = schedule.end;
  scheduleDays.forEach((input) => {
    input.checked = schedule.days.includes(Number(input.value));
  });
}

function render() {
  list.replaceChildren();
  domains.forEach((domain) => {
    const item = document.createElement("li");
    const label = document.createElement("code");
    label.textContent = domain;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove";
    remove.textContent = "Remove";
    remove.addEventListener("click", async () => {
      const response = await chrome.runtime.sendMessage({ type: "removeDomain", domain });
      if (!response.ok) {
        status.textContent = `Could not remove: ${response.error}`;
        return;
      }
      domains = response.domains;
      render();
      status.textContent = response.accessRemoved
        ? `${domain} was removed. Chrome access to that site was also removed.`
        : `${domain} was removed.`;
    });
    item.append(label, remove);
    list.append(item);
  });
}

async function save(message = "Saved.") {
  const response = await chrome.runtime.sendMessage({ type: "saveDomains", domains });
  if (!response.ok) {
    status.textContent = `Could not save: ${response.error}`;
    return;
  }
  domains = response.domains;
  render();
  status.textContent = message;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const domain = normalise(input.value);
  error.textContent = "";
  if (!isValidDomain(input.value)) {
    error.textContent = "Enter a valid domain, optionally followed by a path.";
    return;
  }
  if (domains.includes(domain)) {
    error.textContent = "That website is already blocked.";
    return;
  }

  const granted = await chrome.permissions.request({ origins: originPatternsForDomain(domain, includeSubdomains.checked) });
  if (!granted) {
    error.textContent = "Chrome permission is needed to block that website.";
    return;
  }

  domains.push(domain);
  await save(`${domain} is now blocked.`);
  input.value = "";
  input.focus();
});

restoreButton.addEventListener("click", async () => {
  const granted = await chrome.permissions.request({
    origins: DEFAULT_DOMAINS.flatMap((domain) => originPatternsForDomain(domain, includeSubdomains.checked))
  });
  if (!granted) {
    status.textContent = "Default protection was not enabled, so your blocklist was unchanged.";
    return;
  }

  const response = await chrome.runtime.sendMessage({ type: "restoreDefaults" });
  if (!response.ok) {
    status.textContent = `Could not restore defaults: ${response.error}`;
    return;
  }
  domains = response.domains;
  render();
  status.textContent = "Default blocklist restored and enabled.";
});

scheduleEnabled.addEventListener("change", async () => {
  scheduleControls.hidden = !scheduleEnabled.checked;
  if (scheduleEnabled.checked && !scheduleDays.some((input) => input.checked)) {
    scheduleDays.slice(0, 5).forEach((input) => { input.checked = true; });
  }
  const response = await chrome.runtime.sendMessage({ type: "saveSchedule", schedule: currentSchedule() });
  status.textContent = response.ok ? "Focus schedule saved." : `Could not save schedule: ${response.error}`;
});

[scheduleStart, scheduleEnd, ...scheduleDays].forEach((control) => {
  control.addEventListener("change", async () => {
    if (!scheduleEnabled.checked) return;
    if (!scheduleDays.some((input) => input.checked)) {
      status.textContent = "Choose at least one day for the focus schedule.";
      return;
    }
    const response = await chrome.runtime.sendMessage({ type: "saveSchedule", schedule: currentSchedule() });
    status.textContent = response.ok ? "Focus schedule saved." : `Could not save schedule: ${response.error}`;
  });
});

curatedEnabled.addEventListener("change", async () => {
  if (curatedEnabled.checked) {
    const granted = await chrome.permissions.request({
      origins: CURATED_LLM_CHAT_DOMAINS.flatMap((domain) => originPatternsForDomain(domain, includeSubdomains.checked))
    });
    if (!granted) {
      curatedEnabled.checked = false;
      status.textContent = "Chrome permission is needed before the collection can be enabled.";
      return;
    }
  }

  const response = await chrome.runtime.sendMessage({ type: "setCuratedEnabled", enabled: curatedEnabled.checked });
  if (!response.ok) {
    curatedEnabled.checked = !curatedEnabled.checked;
    status.textContent = `Could not update the collection: ${response.error}`;
    return;
  }
  status.textContent = curatedEnabled.checked
    ? `LLM/chat collection enabled (${CURATED_LLM_CHAT_DOMAINS.length} sites).`
    : "LLM/chat collection disabled.";
});

includeSubdomains.addEventListener("change", async () => {
  if (includeSubdomains.checked) {
    const settings = await chrome.runtime.sendMessage({ type: "getSettings" });
    const granted = await chrome.permissions.request({
      origins: settings.domains.flatMap((domain) => originPatternsForDomain(domain, true))
    });
    if (!granted) {
      includeSubdomains.checked = false;
      status.textContent = "Chrome permission is needed before related subdomains can be blocked.";
      return;
    }
  }
  const response = await chrome.runtime.sendMessage({ type: "setIncludeSubdomains", enabled: includeSubdomains.checked });
  if (!response.ok) {
    includeSubdomains.checked = !includeSubdomains.checked;
    status.textContent = `Could not update subdomain blocking: ${response.error}`;
    return;
  }
  status.textContent = includeSubdomains.checked ? "Related subdomains will be blocked." : "Only exact selected hosts will be blocked.";
});

chrome.runtime.sendMessage({ type: "getSettings" }).then((response) => {
  domains = response.userDomains;
  render();
  renderSchedule(response.schedule);
  curatedEnabled.checked = response.curatedEnabled;
  includeSubdomains.checked = response.includeSubdomains;
  curatedDescription.textContent = `${CURATED_LLM_CHAT_DOMAINS.length} additional LLM/chat sites. The reviewed list is bundled with each extension release; enabling it asks Chrome only for those sites.`;
});
