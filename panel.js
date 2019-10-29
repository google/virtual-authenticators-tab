let tabId = chrome.devtools.inspectedWindow.tabId;
let _enabled = false;
let authenticators = [];
let pollingHandle;

let displayError = error => {
  let message;
  try {
    message = JSON.parse(error).message;
  } catch (e) {
    message = error;
  }
  let container = document.getElementById("error-container");
  let row = document.createElement("div");
  row.classList.add("error-row");
  row.innerText = message;
  container.appendChild(row);
  window.setTimeout(() => container.removeChild(row), 30000);
};

let displayEnabled = enabled => {
  _enabled = enabled;

  document.getElementById("toggle").checked = enabled;
  if (enabled) {
    document.getElementById("authenticators").classList.remove("hidden");
    document.getElementById("splash").classList.add("hidden");
  } else {
    authenticators.slice().forEach(removeAuthenticatorDisplay);
    document.getElementById("authenticators").classList.add("hidden");
    document.getElementById("splash").classList.remove("hidden");
  }
};

let removeAuthenticatorDisplay = authenticator => {
  let row = document.getElementById(authenticator.id);
  let parent = row.parentNode;
  parent.removeChild(row);
  parent.removeChild(document.getElementById(`credentials-${authenticator.id}`));
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
    <td class="align-center">
      <input type="checkbox" disabled
             ${authenticator.options.hasResidentKey ? "checked" : ""}>
    </td>
    <td class="align-center">
      <input type="checkbox" disabled
             ${authenticator.options.hasUserVerification ? "checked" : ""}>
    </td>
    <td class="align-center">
      <button id="remove-${authenticator.id}">Remove</button>
    </td>
  `;
  let row = document.createElement("tr");
  row.id = authenticator.id;
  row.classList.add("authenticator-row");
  row.innerHTML = text;

  let credentialsRow = document.createElement("tr");
  credentialsRow.id = `credentials-${authenticator.id}`;
  credentialsRow.innerHTML =
    `<td colspan="99 class="no-credentials align-center">No Credentials</td>`;

  let tableBody = document.getElementById("authenticator-table-body")
  tableBody.appendChild(row);
  tableBody.appendChild(credentialsRow);
  document.getElementById(`remove-${authenticator.id}`).addEventListener(
    "click", () => removeAuthenticator(authenticator));
};

let addVirtualAuthenticator = authenticator => {
  chrome.debugger.sendCommand(
    {tabId}, "WebAuthn.addVirtualAuthenticator", authenticator,
    (response) => {
      if (chrome.runtime.lastError) {
        displayError(chrome.runtime.lastError.message);
        return;
      }
      authenticator.id = response.authenticatorId;
      renderAuthenticator(authenticator);
    });
};

let startPollingForCredentials = () => {
  pollingHandle = window.setInterval(() => {
    authenticators.forEach(authenticator => {
      chrome.debugger.sendCommand(
        {tabId}, "WebAuthn.getCredentials", {authenticatorId: authenticator.id},
        (response) => {
          if (chrome.runtime.lastError) {
            displayError(chrome.runtime.lastError.message);
            return;
          }
          let row = document.getElementById(`credentials-${authenticator.id}`);
          let oldTable = row.querySelector(".credentials-table");
          if (oldTable)
            row.removeChild(oldTable);
          if (response.credentials.length === 0) {
            row.classList.remove("hidden");
            return;
          }
          row.classList.add("hidden");
        });
    })
  }, 1000);
};

let stopPollingForCredentials = () => {
  window.clearInterval(pollingHandle);
};

let enable = () => {
  chrome.debugger.attach({tabId}, "1.3", () => {
    if (chrome.runtime.lastError) {
      displayError(chrome.runtime.lastError.message);
      document.getElementById("toggle").checked = false;
      return;
    }
    chrome.debugger.sendCommand(
        {tabId}, "WebAuthn.enable", {}, () => {
          displayEnabled(true);
          startPollingForCredentials();
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
  stopPollingForCredentials();
  chrome.debugger.detach({tabId}, () => displayEnabled(false));
};

window.addEventListener("beforeunload", () => {
  if (_enabled)
    chrome.debugger.detach({tabId}, () => {});
});

displayEnabled(false);

let toggle = document.getElementById("toggle");
toggle.addEventListener("click", (e) => {
  if (toggle.checked)
    enable();
  else
    disable();
});

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
