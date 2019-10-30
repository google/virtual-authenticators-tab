"use strict";

import {html, render} from "lit-html";
import "./modules/authenticator-table.js";
import "./modules/display-error.js";

let tabId = chrome.devtools.inspectedWindow.tabId;
let _enabled = false;

let displayError = error => {
  let container = document.querySelector("display-error");
  container.errors = container.errors.concat([error]);
  window.setTimeout(
    () => container.errors = container.errors.filter(e => e !== error), 15000);
};

window.addEventListener("on-error", event => {
  displayError(event.detail);
});

let displayEnabled = enabled => {
  _enabled = enabled;

  document.getElementById("toggle").checked = enabled;
  if (enabled) {
    document.getElementById("splash").classList.add("hidden");
    document.getElementById("authenticators").classList.remove("hidden");
  } else {
    document.getElementById("authenticators").classList.add("hidden");
    document.getElementById("authenticators").removeChild(
      document.querySelector("authenticator-table"));
    document.getElementById("splash").classList.remove("hidden");
  }
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
          let table = document.createElement("authenticator-table");
          document.getElementById("authenticators").appendChild(table);
          table.tabId = tabId;
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

let toggle = document.getElementById("toggle");
toggle.addEventListener("click", (e) => {
  if (toggle.checked)
    enable();
  else
    disable();
});
