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
    remove.addEventListener("click", () => {
      domains = domains.filter((entry) => entry !== domain);
      save();
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
  domains.push(domain);
  await save(`${domain} is now blocked.`);
  input.value = "";
  input.focus();
});

restoreButton.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({ type: "restoreDefaults" });
  if (!response.ok) {
    status.textContent = `Could not restore defaults: ${response.error}`;
    return;
  }
  domains = response.domains;
  render();
  status.textContent = "Default blocklist restored.";
});

chrome.runtime.sendMessage({ type: "getDomains" }).then((response) => {
  domains = response.domains;
  render();
});
