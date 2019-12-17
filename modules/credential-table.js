// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {LitElement, html, css} from "lit-element";

class CredentialTable extends LitElement {
  static get properties() {
    return {
      authenticatorId: {type: String},
      credentials: {type: Array},
    };
  }

  static get styles() {
    return css`
      .code {
        font-family: monospace;
      }
      table {
        width: 100%;
        border-spacing: 0;
        border: rgb(170, 170, 170) 1px solid;
      }
      thead {
        background-color: rgb(243, 243, 243);
        height: 18px;
      }
      thead th {
        font-weight: normal;
        text-align: left;
        border-bottom: rgb(170, 170, 170) 1px solid;
        border-left: rgb(170, 170, 170) 1px solid;
        border-right: rgb(170, 170, 170) 1px solid;
        padding: 1px 4px;
      }
      table button {
        display: block;
        width: 85%;
        margin: auto;
      }
      table td {
        padding: 5px;
        min-height: 20px;
        border-left: rgb(170, 170, 170) 1px solid;
        border-right: rgb(170, 170, 170) 1px solid;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      tbody tr:nth-child(even) {
        background-color: rgb(242, 247, 253);
      }
      .empty-table td {
        padding: 8px;
      }
      .small-column {
        width: 10em;
      }
      .align-center {
        text-align: center;
      }
      .align-left {
        text-align: left;
      }
      .align-right {
        text-align: right;
      }
    `;
  }

  constructor() {
    super();
    this.authenticatorId = null;
    this.credentials = [];
    this.tabId = chrome.devtools.inspectedWindow.tabId;
  }

  disconnectedCallback() {
    window.clearInterval(this.intervalHandle);
    super.disconnectedCallback();
  }

  attributeChangedCallback(name, _, value) {
    if (name !== "authenticatorid" || !value)
      return;

    this.intervalHandle = window.setInterval(() => {
      chrome.debugger.sendCommand(
        {tabId: this.tabId}, "WebAuthn.getCredentials",
        {authenticatorId: this.authenticatorId},
        (response) => {
          if (chrome.runtime.lastError) {
            this.dispatchEvent(new CustomEvent("on-error", {
              detail: chrome.runtime.lastError.message,
              bubbles: true,
              composed: true,
            }));
            return;
          }
          this.credentials = response.credentials;
        });
    }, 1000);

    super.attributeChangedCallback(name, _, value);
  }

  removeCredential(credential) {
    chrome.debugger.sendCommand(
      {tabId: this.tabId}, "WebAuthn.removeCredential",
      {
        authenticatorId: this.authenticatorId,
        credentialId: credential.credentialId
      },
      (response) => {
        if (chrome.runtime.lastError) {
          this.dispatchEvent(new CustomEvent("on-error", {
            detail: chrome.runtime.lastError.message,
            bubbles: true,
            composed: true,
          }));
          return;
        }
        this.credentials =
          this.credentials.filter(c => c.id !== credential.credentialId);
      });
  }

  export(credential) {
    let pem = `-----BEGIN PRIVATE KEY-----
${credential.privateKey}
-----END PRIVATE KEY-----`;
    let link = document.createElement("a");
    document.body.appendChild(link);
    link.download = "Private key.pem";
    link.href = "data:application/x-pem-file;charset=utf-8," + encodeURIComponent(pem);
    link.click();
    document.body.removeChild(link);
  }

  render() {
    return html`
      <h3>Credentials</h3>
      <table>
        <thead>
          <tr>
            <th class="align-left">ID</th>
            <th class="small-column">Is Resident</th>
            <th class="small-column">RP ID</th>
            <th class="small-column">User Handle</th>
            <th class="small-column">Sign Count</th>
            <th class="small-column"></th>
            <th class="small-column"></th>
          </tr>
        </thead>
        <tbody>
          ${this.credentials.length === 0 ? html`
            <tr class="align-center empty-table">
              <td colspan="99">
                No Credentials. Try calling
                <span class="code">navigator.credentials.create()</span>
                from your website.
              </td>
            </tr>
          ` : html``}
          ${this.credentials.map(credential => html`
            <tr>
              <td class="code">${credential.credentialId}</td>
              <td class="align-center">
                <input type="checkbox" disabled
                       ?checked="${credential.isResidentCredential}">
              </td>
              <td>${credential.rpId || "<unknown RP ID>"}</td>
              <td>${credential.userHandle || "<no user handle>"}</td>
              <td class="align-center">${credential.signCount}</td>
              <td class="align-center">
                <a @click="${this.export.bind(this, credential)}" href="#">
                  Export
                </a>
              </td>
              <td class="align-center">
                <a @click="${this.removeCredential.bind(this, credential)}" href="#">
                  Remove
                </a>
              </td>
            </tr>
         `)}
        </tbody>
      </table>
    `;
  }
}

customElements.define("credential-table", CredentialTable);
