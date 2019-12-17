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
import "./credential-table.js";

class AuthenticatorTable extends LitElement {
  static get properties() {
    return {
      authenticators: {type: Array},
      protocol: {type: String},
      transport: {type: String},
      hasResidentKey: {type: Boolean},
      hasUserVerification: {type: Boolean},
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
      }
      table button {
        display: block;
        width: 85%;
        margin: auto;
      }
      table td {
        padding: 5px;
        min-height: 20px;
      }
      #empty-table {
        background-color: #EEEEEE;
      }
      #empty-table td {
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
      .content {
        background-color: white;
        border-bottom: 1px solid #d0d0d0;
        padding: 15px;
        padding-left: 30px;
      }
      .detail-row {
        padding-bottom: 10px;
      }
      .detail-title {
        color: #888;
        text-align: right;
        width: 150px;
        display: inline-block;
      }
      .detail-column {
        margin-left: 10px;
        text-align: left;
        display: inline-block;
      }
      button :hover {
        cursor: pointer;
      }
      button {
        border-radius: 5px;
        color: #1a73e8;
        background-color: white;
        border-style: solid;
        border-width: 1px;
        border-color: f9f9f9;
        padding: 0 12px;
        height: 24px;
      }
      select {
        width: 7em;
        border-radius: 5px;
        color: #1a73e8;
        background-color: white;
        border-style: solid;
        border-width: 1px;
        border-color: f9f9f9;
        padding: 0 5px;
        height: 24px;
      }
    `;
  }

  constructor() {
    super();
    this.authenticators = [];
    this.protocol = "ctap2";
    this.transport = "usb";
    this.hasResidentKey = true;
    this.hasUserVerification = false;
    this.tabId = chrome.devtools.inspectedWindow.tabId;
  }

  protocolChanged(event) {
    this.protocol = event.target.value;
  }

  transportChanged(event) {
    this.transport = event.target.value;
  }

  hasResidentKeyChanged(event) {
    this.hasResidentKey = event.target.checked;
  }

  hasUserVerificationChanged(event) {
    this.hasUserVerification = event.target.checked;
  }

  addAuthenticator() {
    let authenticator = {
      protocol: this.protocol,
      transport: this.transport,
      hasResidentKey: this.hasResidentKey,
      hasUserVerification: this.hasUserVerification,
      isUserVerified: this.hasUserVerification,
    };
    chrome.debugger.sendCommand(
      {tabId: this.tabId},
      "WebAuthn.addVirtualAuthenticator", {options: authenticator},
      (response) => {
        if (chrome.runtime.lastError) {
          this.dispatchEvent(new CustomEvent("on-error", {
            detail: chrome.runtime.lastError.message,
            bubbles: true,
            composed: true,
          }));
          return;
        }
        authenticator.id = response.authenticatorId;
        this.authenticators = this.authenticators.concat([authenticator]);
      });
  }

  removeAuthenticator(authenticator) {
    chrome.debugger.sendCommand(
      {tabId: this.tabId}, "WebAuthn.removeVirtualAuthenticator", {
        authenticatorId: authenticator.id,
      },
      () => {
        this.authenticators =
          this.authenticators.filter(a => a.id !== authenticator.id);
      });
  }

  render() {
    return html`
      ${this.authenticators.length === 0 ? html`
        <div class="content">
          <p class="align-center">
            No Authenticators. Try adding one using the controls below.
          </p>
        </div>
      ` : html``}

      ${this.authenticators.map(authenticator => html`
        <div class="content">
          <p>
            <strong>Authenticator <span class="code">${authenticator.id}</span></strong>
            <a @click=${this.removeAuthenticator.bind(this, authenticator)}"
                    style="float: right;" href="#">
              Remove
            </a>
          </p>
          <div class="detail-row">
            <div class="detail-title">Protocol</div>
            <div class="detail-column">
              <span class="code">${authenticator.protocol}</span>
            </div>
          </div>
          <div class="detail-row">
            <div class="detail-title">Transport</div>
            <div class="detail-column">
              <span class="code">${authenticator.transport}</span>
            </div>
          </div>
          <div class="detail-row">
            <div class="detail-title">Supports Resident Keys</div>
            <div class="detail-column">
              <span class="code">${authenticator.hasResidentKey ? "Yes" : "No"}</span>
            </div>
          </div>
          <div class="detail-row">
            <div class="detail-title">Supports User Verification</div>
            <div class="detail-column">
              <span class="code">${authenticator.hasUserVerification ? "Yes" : "No"}</span>
            </div>
          </div>
          <br>
          <credential-table authenticatorid="${authenticator.id}">
          <hr>
        </div>
        `
      )}
      <div class="content">
        <strong>New Authenticator</strong>
        <div class="detail-row">
          <div class="detail-title">Protocol</div>
          <div class="detail-column">
            <select .value="${this.protocol}" @input="${this.protocolChanged}">
              <option value="ctap2">ctap2</option>
              <option value="u2f">u2f</option>
            </select>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-title">Transport</div>
          <div class="detail-column">
            <select .value="${this.transport}" @input="${this.transportChanged}">
              <option value="usb">usb</option>
              <option value="nfc">nfc</option>
              <option value="ble">ble</option>
              <option value="internal">internal</option>
            </select>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-title">Supports Resident Keys</div>
          <div class="detail-column">
            <input type="checkbox" .checked=${this.hasResidentKey}
                   @input="${this.hasResidentKeyChanged}" name="has-rk">
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-title">Supports User Verification</div>
          <div class="detail-column">
            <input type="checkbox" .checked="${this.hasUserVerification}"
                   @input="${this.hasUserVerificationChanged}" name="has-uv">
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-title"></div>
          <div class="detail-column">
            <button @click="${this.addAuthenticator}">Add</button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("authenticator-table", AuthenticatorTable);
