const count = document.querySelector("#count");
document.querySelector("#open-settings").addEventListener("click", () => chrome.runtime.openOptionsPage());

chrome.runtime.sendMessage({ type: "getDomains" }).then((response) => {
  const total = response.domains.length;
  count.textContent = `${total} website${total === 1 ? "" : "s"} on your blocklist.`;
});
