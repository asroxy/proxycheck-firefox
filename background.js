chrome.runtime.onInstalled.addListener(() => {
    // Context menu for IP
    chrome.contextMenus.create({
        id: "check_ip",
        title: "Check IP",
        contexts: ["selection"],
        documentUrlPatterns: ["<all_urls>"]
    });
    
    // Context menu for Email
    chrome.contextMenus.create({
        id: "check_email",
        title: "Check Email",
        contexts: ["selection"],
        documentUrlPatterns: ["<all_urls>"]
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const selectedText = info.selectionText.trim();

    if (info.menuItemId === "check_ip") {
        if (/^(\d{1,3}\.){3}\d{1,3}$|^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9]))$/.test(selectedText)) {
            chrome.tabs.sendMessage(tab.id, { action: "check_ip", ip: selectedText });
        } else {
            chrome.tabs.sendMessage(tab.id, { action: "show_alert", message: "Please select a valid IP address." });
        }
    }
    
    if (info.menuItemId === "check_email") {
        if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(selectedText)) {
            chrome.tabs.sendMessage(tab.id, { action: "check_email", email: selectedText });
        } else {
            chrome.tabs.sendMessage(tab.id, { action: "show_alert", message: "Please select a valid email address." });
        }
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetch_ip_data") {
        const { ip, proxycheckApiKey } = request;
        const proxyCheckUrl = `https://proxycheck.io/v2/${ip}?key=${proxycheckApiKey}&vpn=1&asn=1&tag=ProxyCheck%20for%20Chrome`;

        fetch(proxyCheckUrl)
            .then((response) => response.json())
            .then((data) => {
                sendResponse({ success: true, data });
            })
            .catch((error) => {
                console.error("Error fetching IP data:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Required to indicate an async response
    }

    if (request.action === "fetch_email_data") {
        const { email, proxycheckApiKey } = request;
        const proxyCheckUrl = `https://proxycheck.io/v2/${email}?key=${proxycheckApiKey}&tag=ProxyCheck%20for%20Firefox`;

        fetch(proxyCheckUrl)
            .then((response) => response.json())
            .then((data) => {
                console.log("Email Data Response:", data); // Log the response to help debug
                const disposableStatus = data[email] && data[email].disposable ? data[email].disposable : "unknown";
                if (sender && sender.tab && sender.tab.id) {
                    chrome.tabs.sendMessage(sender.tab.id, { action: "show_email_status", disposableStatus });
                }
                sendResponse({ success: true, data });
            })
            .catch((error) => {
                console.error("Error fetching email data:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Required to indicate an async response
    }

    if (request.action === "block_asn") {
        const { asn, email, apiKey, zoneId } = request;
        const url = `https://api.cloudflare.com/client/v4/accounts/${zoneId}/firewall/access_rules/rules`;

        const headers = {
            "X-Auth-Email": email,
            "X-Auth-Key": apiKey,
            "Content-Type": "application/json"
        };

        fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                mode: "block",
                configuration: {
                    target: "asn",
                    value: asn
                },
                notes: "Datacenter ASN"
            })
        })
            .then((response) => response.json())
            .then((result) => {
                if (result.success) {
                    sendResponse({ success: true });
                } else {
                    console.error("Failed to block ASN:", result.errors);
                    const errorMessage = result.errors.map((error) => error.message).join(", ");
                    sendResponse({ success: false, error: errorMessage });
                }
            })
            .catch((error) => {
                console.error("Error blocking ASN in Cloudflare:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Required to indicate an async response
    }

    if (request.action === "block_ip") {
        const { ip, email, apiKey, zoneId } = request;
        const url = `https://api.cloudflare.com/client/v4/accounts/${zoneId}/firewall/access_rules/rules`;

        const headers = {
            "X-Auth-Email": email,
            "X-Auth-Key": apiKey,
            "Content-Type": "application/json"
        };

        fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                mode: "block",
                configuration: {
                    target: "ip",
                    value: ip
                },
                notes: "Blocked by Proxycheck for Firefox"
            })
        })
            .then((response) => response.json())
            .then((result) => {
                if (result.success) {
                    sendResponse({ success: true });
                } else {
                    console.error("Failed to block IP:", result.errors);
                    const errorMessage = result.errors.map((error) => error.message).join(", ");
                    sendResponse({ success: false, error: errorMessage });
                }
            })
            .catch((error) => {
                console.error("Error blocking IP in Cloudflare:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Required to indicate an async response
    }
});
