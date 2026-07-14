const count = document.querySelector("#count");
const protectionStatus = document.querySelector("#protection-status");
const protectionTitle = document.querySelector("#protection-title");
const enableProtection = document.querySelector("#enable-protection");
document.querySelector("#open-settings").addEventListener("click", () => chrome.runtime.openOptionsPage());

function originPatternsForDomain(domain) {
  const host = domain.split("/")[0];
  return [`http://${host}/*`, `https://${host}/*`];
}

async function render() {
  const response = await chrome.runtime.sendMessage({ type: "getStatus" });
  if (!response || response.ok === false) {
    protectionStatus.textContent = "Protection status unavailable";
    protectionTitle.textContent = "Open settings to try again";
    count.textContent = response?.error || "The extension could not read your blocklist.";
    return;
  }

  const total = response.domains.length;
  const protectedTotal = response.protectedDomains.length;
  const missingTotal = total - protectedTotal;

  if (protectedTotal === total) {
    protectionStatus.textContent = "Protection active";
    protectionTitle.textContent = "LLM sites are blocked";
    count.textContent = `${total} website${total === 1 ? "" : "s"} on your blocklist.`;
    enableProtection.hidden = true;
    return;
  }

  protectionStatus.textContent = protectedTotal ? "Protection needs approval" : "Protection is ready";
  protectionTitle.textContent = protectedTotal ? "Approve the remaining sites" : "Choose the sites to block";
  count.textContent = `${protectedTotal} of ${total} website${total === 1 ? "" : "s"} currently blocked. Chrome will ask for access only to the ${missingTotal} site${missingTotal === 1 ? "" : "s"} awaiting approval.`;
  enableProtection.hidden = false;
}

enableProtection.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({ type: "getStatus" });
  const missingDomains = response.domains.filter((domain) => !response.protectedDomains.includes(domain));
  enableProtection.disabled = true;
  const granted = await chrome.permissions.request({
    origins: missingDomains.flatMap(originPatternsForDomain)
  });
  if (!granted) {
    enableProtection.disabled = false;
    count.textContent = "Chrome permission is needed before the selected sites can be blocked.";
    return;
  }
  await chrome.runtime.sendMessage({ type: "syncRules" });
  enableProtection.disabled = false;
  await render();
});

render();
