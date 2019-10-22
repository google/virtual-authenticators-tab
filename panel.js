let enableButton = document.getElementById("enable");
let disableButton = document.getElementById("disable");
let tabId = chrome.devtools.inspectedWindow.tabId;
let _enabled = false;
let authenticators = [];

let displayEnabled = enabled => {
  _enabled = enabled;

  if (enabled) {
    enableButton.classList.add("hidden");
    disableButton.classList.remove("hidden");
    document.getElementById("authenticators").classList.remove("hidden");
  } else {
    authenticators.slice().forEach(removeAuthenticatorDisplay);
    disableButton.classList.add("hidden");
    enableButton.classList.remove("hidden");
    document.getElementById("authenticators").classList.add("hidden");
  }
};

let removeAuthenticatorDisplay = authenticator => {
  let row = document.getElementById(authenticator.id);
  row.parentNode.removeChild(row);
  authenticators.splice(authenticators.indexOf(authenticator), 1);
  if (authenticators.length == 0)
    document.getElementById("empty-table").classList.remove("hidden");
};

let removeAuthenticator = authenticator => {
  chrome.debugger.sendCommand(
    {tabId}, "WebAuthn.removeVirtualAuthenticator", {
      authenticatorId: authenticator.id,
    },
    () => removeAuthenticatorDisplay(authenticator));
};

let renderAuthenticator = authenticator => {
  document.getElementById("empty-table").classList.add("hidden");
  authenticators.push(authenticator);
  let text = `
    <td class="code">${authenticator.id}</td>
    <td class="align-center">${authenticator.options.protocol}</td>
    <td class="align-center">${authenticator.options.transport}</td>
    <td class="align-center">${authenticator.options.hasResidentKey}</td>
    <td class="align-center">${authenticator.options.hasUserVerification}</td>
    <td class="align-right">0</td>
    <td class="align-center">
      <button id="remove-${authenticator.id}">Remove</button>
    </td>
  `;
  let row = document.createElement("tr");
  row.id = authenticator.id;
  row.classList.add("authenticator-row");
  row.innerHTML = text;
  document.getElementById("authenticator-table-body").appendChild(row);
  document.getElementById(`remove-${authenticator.id}`).addEventListener(
    "click", () => removeAuthenticator(authenticator));

  displayEnabled(true);
};

let addVirtualAuthenticator = authenticator => {
  chrome.debugger.sendCommand(
    {tabId}, "WebAuthn.addVirtualAuthenticator", authenticator,
    (response) => {
      authenticator.id = response.authenticatorId;
      renderAuthenticator(authenticator);
    });
};

let enable = () => {
  chrome.debugger.attach({tabId}, "1.3", () => {
    chrome.debugger.sendCommand(
        {tabId}, "WebAuthn.enable", {}, () => {
          addVirtualAuthenticator({
            options: {
              protocol: "ctap2",
              transport: "usb",
              hasResidentKey: true,
              hasUserVerification: false,
            },
          });
        });
  });
  chrome.debugger.onDetach.addListener(source => {
    if (source.tabId == tabId) {
      displayEnabled(false);
    }
  });
};

let disable = async () => {
  chrome.debugger.detach({tabId}, () => displayEnabled(false));
};

window.addEventListener("beforeunload", () => {
  if (_enabled)
    chrome.debugger.detach({tabId}, () => {});
});

displayEnabled(false);
enableButton.addEventListener("click", () => enable());
disableButton.addEventListener("click", () => disable());
document.getElementById("add-authenticator").addEventListener("click", () => {
  addVirtualAuthenticator({
    options: {
      protocol: document.getElementById("protocol").value,
      transport: document.getElementById("transport").value,
      hasResidentKey: document.getElementById("has-rk").checked,
      hasUserVerification: document.getElementById("has-uv").checked,
      isUserVerified: document.getElementById("has-uv").checked,
    },
  });
});
