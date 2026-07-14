const form = document.querySelector("#add-form");
const input = document.querySelector("#domain");
const error = document.querySelector("#form-error");
const list = document.querySelector("#domain-list");
const status = document.querySelector("#save-status");
const restoreButton = document.querySelector("#restore-defaults");

let domains = [];

function isValidDomain(value) {
  const normalised = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[?#]/)[0].replace(/\/$/, "");
  return /^[a-z0-9.-]+(?:\/[a-z0-9._~!$&'()*+,;=:@%-]+)*$/.test(normalised) && normalised.split("/")[0].includes(".");
}

function normalise(value) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[?#]/)[0].replace(/\/$/, "");
}

function originPatternsForDomain(domain) {
  const host = domain.split("/")[0];
  return [`http://${host}/*`, `https://${host}/*`];
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

  const granted = await chrome.permissions.request({ origins: originPatternsForDomain(domain) });
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
  const defaultDomains = [
    "chatgpt.com", "chat.openai.com", "claude.ai", "gemini.google.com", "aistudio.google.com",
    "copilot.microsoft.com", "bing.com/chat", "perplexity.ai", "poe.com", "grok.com", "x.ai",
    "mistral.ai/chat", "lechat.mistral.ai", "meta.ai", "character.ai", "you.com", "pi.ai",
    "deepseek.com", "chat.deepseek.com", "huggingface.co/chat"
  ];
  const granted = await chrome.permissions.request({
    origins: defaultDomains.flatMap(originPatternsForDomain)
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

chrome.runtime.sendMessage({ type: "getDomains" }).then((response) => {
  domains = response.domains;
  render();
});
