let enableButton = document.getElementById("enable");
let disableButton = document.getElementById("disable");
let tab;

let displayEnabled = enabled => {
  if (enabled) {
    enableButton.classList.add("hidden");
    disableButton.classList.remove("hidden");
    chrome.browserAction.setBadgeText({text: 'ON'});
  } else {
    disableButton.classList.add("hidden");
    enableButton.classList.remove("hidden");
    chrome.browserAction.setBadgeText({text: 'OFF'});
  }
};

let setEnabled = enabled => {
  let options = {};
  options[tab.id] = {
    enabled,
  };
  chrome.storage.local.set(options, () => displayEnabled(enabled));
};

let addVirtualAuthenticator = () => {
  chrome.debugger.sendCommand({tabId: tab.id}, "WebAuthn.addVirtualAuthenticator", {
    authenticatorId: "extension-virtual-authenticator",
    options: {
      protocol: "ctap2",
      transport: "usb",
      hasResidentKey: true,
      hasUserVerification: false,
    }
  }, () => setEnabled(true));
};

let enable = () => {
  chrome.debugger.attach({tabId: tab.id}, "1.3", () => {
    chrome.debugger.sendCommand(
        {tabId: tab.id}, "WebAuthn.enable", {}, addVirtualAuthenticator);
  });
};

let disable = async () => {
  chrome.debugger.detach({tabId: tab.id}, () => {
    chrome.debugger.sendCommand(
        {tabId: tab.id}, "WebAuthn.disable", {}, () => setEnabled(false));
  });
};

chrome.tabs.query({active: true, currentWindow: true}, tabs => {
  tab = tabs[0];
  let defaults = {};
  defaults[tab.id] = {
    enabled: false,
  };
  chrome.storage.local.get(defaults, result => {
    displayEnabled(result[tab.id].enabled);
  });
  enableButton.disabled = false;
  disableButton.disabled = false;
  enableButton.addEventListener("click", () => enable());
  disableButton.addEventListener("click", () => disable());
});
