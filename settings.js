document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.sync.get(["proxycheckApiKey", "cloudflareEmail", "cloudflareApiKey", "cloudflareZoneId"], (result) => {
      if (chrome.runtime.lastError) {
        console.error("Error fetching settings: ", chrome.runtime.lastError);
        return;
      }
      console.log("Fetched settings: ", result);
      document.getElementById("proxycheckApiKey").value = result.proxycheckApiKey || "";
      document.getElementById("cloudflareEmail").value = result.cloudflareEmail || "";
      document.getElementById("cloudflareApiKey").value = result.cloudflareApiKey || "";
      document.getElementById("cloudflareZoneId").value = result.cloudflareZoneId || "";
    });
  });
  
  const saveButton = document.getElementById("save");
  saveButton.addEventListener("click", () => {
    const proxycheckApiKey = document.getElementById("proxycheckApiKey").value;
    const cloudflareEmail = document.getElementById("cloudflareEmail").value;
    const cloudflareApiKey = document.getElementById("cloudflareApiKey").value;
    const cloudflareZoneId = document.getElementById("cloudflareZoneId").value;
  
    chrome.storage.sync.set({ proxycheckApiKey, cloudflareEmail, cloudflareApiKey, cloudflareZoneId }, () => {
      alert("Settings saved.");
    });
  });
  