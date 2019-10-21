let enableButton = document.getElementById("enable");
let disableButton = document.getElementById("disable");
let tabId = chrome.devtools.inspectedWindow.tabId;
let _enabled = false;

let displayEnabled = enabled => {
  _enabled = enabled;

  if (enabled) {
    enableButton.classList.add("hidden");
    disableButton.classList.remove("hidden");
  } else {
    disableButton.classList.add("hidden");
    enableButton.classList.remove("hidden");
  }
};

let addVirtualAuthenticator = () => {
  chrome.debugger.sendCommand({tabId}, "WebAuthn.addVirtualAuthenticator", {
    authenticatorId: "extension-virtual-authenticator",
    options: {
      protocol: "ctap2",
      transport: "usb",
      hasResidentKey: true,
      hasUserVerification: false,
    }
  }, () => displayEnabled(true));
};

let enable = () => {
  chrome.debugger.attach({tabId}, "1.3", () => {
    chrome.debugger.sendCommand(
        {tabId}, "WebAuthn.enable", {}, addVirtualAuthenticator);
  });
  chrome.debugger.onDetach.addListener(source => {
    if (source.tabId == tabId)
      displayEnabled(false);
  });
};

let disable = async () => {
  chrome.debugger.detach({tabId}, () => {
    chrome.debugger.sendCommand(
        {tabId}, "WebAuthn.disable", {}, () => displayEnabled(false));
  });
};

window.addEventListener("beforeunload", () => {
  if (_enabled)
    chrome.debugger.detach({tabId}, () => {});
});

displayEnabled(false);
enableButton.addEventListener("click", () => enable());
disableButton.addEventListener("click", () => disable());
