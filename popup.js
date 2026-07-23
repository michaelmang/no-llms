const count = document.querySelector("#count");
const protectionStatus = document.querySelector("#protection-status");
const protectionTitle = document.querySelector("#protection-title");
const enableProtection = document.querySelector("#enable-protection");
document.querySelector("#open-settings").addEventListener("click", () => chrome.runtime.openOptionsPage());

function originPatternsForDomain(domain, includeSubdomains = false) {
  const host = domain.split("/")[0];
  const origins = [`http://${host}/*`, `https://${host}/*`];
  if (includeSubdomains) origins.push(`http://*.${host}/*`, `https://*.${host}/*`);
  return origins;
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
  const approvedTotal = response.approvedDomains.length;
  const missingTotal = total - approvedTotal;

  if (missingTotal === 0 && !response.scheduleActive) {
    protectionStatus.textContent = "Scheduled pause";
    protectionTitle.textContent = "LLM sites are available";
    count.textContent = `Your focus schedule is paused. ${approvedTotal} approved site${approvedTotal === 1 ? "" : "s"} will be blocked during the next scheduled window.`;
    enableProtection.hidden = true;
    return;
  }

  if (missingTotal === 0) {
    protectionStatus.textContent = "Protection active";
    protectionTitle.textContent = "LLM sites are blocked";
    count.textContent = `${total} website${total === 1 ? "" : "s"} on your blocklist.`;
    enableProtection.hidden = true;
    return;
  }

  protectionStatus.textContent = approvedTotal ? "Protection needs approval" : "Protection is ready";
  protectionTitle.textContent = approvedTotal ? "Approve the remaining sites" : "Choose the sites to block";
  count.textContent = `${approvedTotal} of ${total} website${total === 1 ? "" : "s"} approved. Chrome will ask for access only to the ${missingTotal} site${missingTotal === 1 ? "" : "s"} awaiting approval.`;
  enableProtection.hidden = false;
}

enableProtection.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({ type: "getStatus" });
  const missingDomains = response.domains.filter((domain) => !response.approvedDomains.includes(domain));
  enableProtection.disabled = true;
  const granted = await chrome.permissions.request({
    origins: missingDomains.flatMap((domain) => originPatternsForDomain(domain, response.includeSubdomains))
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
