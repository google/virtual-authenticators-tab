let enableButton = document.getElementById("enable");
let disableButton = document.getElementById("disable");
let tabId = chrome.devtools.inspectedWindow.tabId;
let targetId;

let displayEnabled = enabled => {
  if (enabled) {
    enableButton.classList.add("hidden");
    disableButton.classList.remove("hidden");
  } else {
    disableButton.classList.add("hidden");
    enableButton.classList.remove("hidden");
  }
};

let addVirtualAuthenticator = () => {
  chrome.debugger.sendCommand({targetId}, "WebAuthn.addVirtualAuthenticator", {
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
  chrome.debugger.attach({targetId}, "1.3", () => {
    chrome.debugger.sendCommand(
        {targetId}, "WebAuthn.enable", {}, addVirtualAuthenticator);
  });
};

let disable = async () => {
  chrome.debugger.detach({targetId}, () => {
    chrome.debugger.sendCommand(
        {targetId}, "WebAuthn.disable", {}, () => displayEnabled(false));
  });
};


chrome.debugger.getTargets(targets => {
  console.log(targets);
  console.log(window.Main);
  console.log(chrome.Main);
  console.log(chrome);
  console.log(chrome.devtools);
  targetId = targets.find(target => target.tabId == tabId).id;
  enableButton.disabled = false;
  disableButton.disabled = false;
});

displayEnabled(false);
enableButton.addEventListener("click", () => enable());
disableButton.addEventListener("click", () => disable());
