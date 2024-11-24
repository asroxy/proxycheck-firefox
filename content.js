chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === "check_ip") {
        try {
            const ip = request.ip;
            const { proxycheckApiKey, cloudflareEmail, cloudflareApiKey, cloudflareZoneId } = await getSettings();
            if (!proxycheckApiKey || !cloudflareEmail || !cloudflareApiKey || !cloudflareZoneId) {
                alert("Please set the API keys and Zone ID in the settings page.");
                return;
            }
  
            // Send a message to the background script to fetch IP data
            chrome.runtime.sendMessage(
                { action: "fetch_ip_data", ip, proxycheckApiKey },
                (response) => {
                    if (response && response.success) {
                        showFormattedPanel(response.data, ip, cloudflareEmail, cloudflareApiKey, cloudflareZoneId);
                    } else {
                        alert(`Failed to fetch IP data: ${response ? response.error : "No response from background script"}`);
                    }
                }
            );
        } catch (error) {
            console.error("Error sending message to background script:", error);
            alert("Failed to send message. Please check your connection or try again later.");
        }
    }

    if (request.action === "check_email") {
        try {
            const email = request.email;
            const { proxycheckApiKey } = await getSettings();
            if (!proxycheckApiKey) {
                alert("Please set the ProxyCheck API key in the settings page.");
                return;
            }
  
            // Send a message to the background script to fetch email data
            chrome.runtime.sendMessage(
                { action: "fetch_email_data", email, proxycheckApiKey },
                (response) => {
                    if (response && response.success) {
                        showEmailResultPanel(response.data, email);
                    } else {
                        alert(`Failed to fetch email data: ${response ? response.error : "No response from background script"}`);
                    }
                }
            );
        } catch (error) {
            console.error("Error sending message to background script:", error);
            alert("Failed to send message. Please check your connection or try again later.");
        }
    }
});

// Function to get the API settings
function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["proxycheckApiKey", "cloudflareEmail", "cloudflareApiKey", "cloudflareZoneId"], (result) => {
            resolve(result);
        });
    });
}

function preloadFont() {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = 'https://cdn.jsdelivr.net/fontsource/fonts/montserrat:vf@latest/latin-wght-normal.woff2';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous'; // Ensures proper CORS handling

    document.head.appendChild(link);
}

// Call the function to preload the font
preloadFont();


function injectStyles() {
    const style = document.createElement("style");
    style.innerHTML = `
        @font-face {
            font-family: 'Montserrat Variable';
            font-style: normal;
            font-display: auto;
            font-weight: 100 200 300 400 500 600 700 900;
            src: url(https://cdn.jsdelivr.net/fontsource/fonts/montserrat:vf@latest/latin-wght-normal.woff2) format('woff2-variations');
            unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;
}
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(1px);
            z-index: 100000;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal-content {
            font-family: 'Montserrat Variable';
            width: 325px;
            height: auto;
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 0 20px 10px rgba(0, 0, 0, 0.2);
        }

        .formatted-text {
            margin: 0;
            padding: 0 0 50px;
            font-size: 12px;
        }

        .formatted-text p {
            line-height: 1;
            margin: 0 0 8px;
            text-wrap: auto;
        }

        .formatted-text a {
            color: #143fa1;
            font-weight: 600;
        }

        .formatted-text strong {
            font-weight: 600;
            font-size: 10px;
            text-transform: uppercase;
            color: #2d3037;
        }

        .buttons-container {
            all: unset;
        }

        .buttons-container button {
            all: unset;
            background-color: #dfe3e8;
            border: 0;
            border-radius: 2px;
            padding: 8px 15px;
            color: #2d3037;
            font-weight: 500;
            font-size: 12px;
        }

        .buttons-container button:hover {
            background-color: #cd1139;
            color: #fff;
        }

        .asn-highlight {
            font-weight: 600;
            color: #1c1f22;
        }
    `;
    document.head.appendChild(style);
}

// Function to show the formatted side panel for IP
function showFormattedPanel(data, ip, cloudflareEmail, cloudflareApiKey, cloudflareZoneId) {
    injectStyles();
    
    const ipDetails = data[ip];
    if (!ipDetails) {
        alert("No data available for this IP address.");
        return;
    }

    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    const formattedText = document.createElement("div");
    formattedText.className = "formatted-text";

    // Styled content
    formattedText.innerHTML = `
        <p><strong>IP Details:</strong> <span class="asn-highlight">${ip}</span></p>
        <p><strong>ASN:</strong> <span class="asn-highlight"><a href="https://ipinfo.io/${ipDetails.asn}" target="_blank" style="Text-decoration:none">${ipDetails.asn}</a></span></p>
        <p><strong>Range:</strong> <span class="asn-highlight">${ipDetails.range}</span></p>
        <p><strong>Provider:</strong> <span class="asn-highlight">${ipDetails.provider}</span></p>
        <p><strong>Organisation:</strong> ${ipDetails.organisation}</p>
        <p><strong>Continent:</strong> ${ipDetails.continent}</p>
        <p><strong>Country:</strong> ${ipDetails.country}</p>
        <p><strong>City:</strong> ${ipDetails.city}</p>
        <p><strong>Latitude:</strong> ${ipDetails.latitude}</p>
        <p><strong>Longitude:</strong> ${ipDetails.longitude}</p>
        <p><strong>Proxy:</strong> <span class="asn-highlight">${ipDetails.proxy}</span></p>
        <p><strong>Type:</strong> <span class="asn-highlight">${ipDetails.type}</span></p>
    `;

    modalContent.appendChild(formattedText);

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "buttons-container";

    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.onclick = () => {
        document.body.removeChild(modalOverlay);
    };
    buttonContainer.appendChild(closeButton);

    const blockASNButton = document.createElement("button");
    blockASNButton.textContent = "Block ASN";
    blockASNButton.style.float = "right";
    blockASNButton.style.marginLeft = "4px";
    blockASNButton.onclick = async () => {
        const asn = ipDetails.asn;
        if (asn) {
            chrome.runtime.sendMessage(
                { action: "block_asn", asn, email: cloudflareEmail, apiKey: cloudflareApiKey, zoneId: cloudflareZoneId },
                (response) => {
                    if (response && response.success) {
                        alert(`ASN ${asn} has been blocked.`);
                    } else {
                        console.error("Failed to block ASN:", response.error);
                        alert(`Failed to block ASN: ${response ? response.error : "No response from background script"}`);
                    }
                }
            );
        }
    };
    buttonContainer.appendChild(blockASNButton);

    const blockIPButton = document.createElement("button");
    blockIPButton.textContent = "Block IP";
    blockIPButton.style.float = "right";
    blockIPButton.style.marginLeft = "10px";
    blockIPButton.onclick = async () => {
        if (ip) {
            chrome.runtime.sendMessage(
                { action: "block_ip", ip, email: cloudflareEmail, apiKey: cloudflareApiKey, zoneId: cloudflareZoneId },
                (response) => {
                    if (response && response.success) {
                        alert(`IP ${ip} has been blocked.`);
                    } else {
                        console.error("Failed to block IP:", response.error);
                        alert(`Failed to block IP: ${response ? response.error : "No response from background script"}`);
                    }
                }
            );
        }
    };
    buttonContainer.appendChild(blockIPButton);

    modalContent.appendChild(buttonContainer);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
}

// Function to show the formatted side panel for Email
function showEmailResultPanel(data, email) {
    injectStyles();

    if (!data) {
        alert("No data available for this email address.");
        return;
    }

    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    const formattedText = document.createElement("div");
    formattedText.style.margin = "0";
    formattedText.style.padding = "0";

    // Styled content
    formattedText.innerHTML = `
        <p style="line-height: 0.5;"><strong>Email Address:</strong> <span style="font-weight: bold; color: #1c1f22;">${email}</span></p>
        <p style="line-height: 0.5;"><strong>Disposable:</strong> <span style="font-weight: bold; color: ${data[email] && data[email].disposable === 'yes' ? '#ff0000' : '#1c1f22'};">${data[email] && data[email].disposable === 'yes' ? 'Yes' : 'No'}</span></p>
    `;

    modalContent.appendChild(formattedText);

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "buttons-container";
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "center";

    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.onclick = () => {
        document.body.removeChild(modalOverlay);
    };
    buttonContainer.appendChild(closeButton);

    modalContent.appendChild(buttonContainer);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
}
