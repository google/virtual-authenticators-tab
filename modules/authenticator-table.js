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
    this.addAuthenticator();
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
        <h3 class="empty-table align-center">
          No Authenticators. Try adding one using the controls below.
        </h3>
      ` : html``}

      ${this.authenticators.map(authenticator => html`
        <h3>
          Authenticator <span class="code">${authenticator.id}</span>
          <button @click=${this.removeAuthenticator.bind(this, authenticator)}"
                  style="float: right;">
            Remove Authenticator
          </button>
        </h3>
        <div>
          <strong>Protocol:</strong>
          <span class="code">${authenticator.protocol}</span>
        </div>
        <div>
          <strong>Transport:</strong>
          <span class="code">${authenticator.transport}</span>
        </div>
        <div>
          <strong>Supports Resident Keys:</strong>
          <span class="code">${authenticator.hasResidentKey ? "Yes" : "No"}</span>
        </div>
        <div>
          <strong>Supports User Verification:</strong>
          <span class="code">${authenticator.hasUserVerification ? "Yes" : "No"}</span>
        </div>
        <br>
        <credential-table authenticatorid="${authenticator.id}">
        <hr>
        `
      )}
      <h2>Add Authenticator</h2>
        <div>
          <strong>Protocol:</strong>
          <select .value="${this.protocol}" @input="${this.protocolChanged}">
            <option value="ctap2">ctap2</option>
            <option value="u2f">u2f</option>
          </select>
        </div>
        <div>
          <strong>Transport:</strong>
          <select .value="${this.transport}" @input="${this.transportChanged}">
            <option value="usb">usb</option>
            <option value="nfc">nfc</option>
            <option value="ble">ble</option>
            <option value="internal">internal</option>
          </select>
        </div>
        <div>
          <strong>Supports Resident Keys:</strong>
          <input type="checkbox" .checked=${this.hasResidentKey}
                 @input="${this.hasResidentKeyChanged}" name="has-rk">
        </div>
        <div>
          <strong>Supports User Verification</strong>
          <input type="checkbox" .checked="${this.hasUserVerification}"
                 @input="${this.hasUserVerificationChanged}" name="has-uv">
        </div>
        <br>
        <button @click="${this.addAuthenticator}">Add</button>
    `;
  }
}

customElements.define("authenticator-table", AuthenticatorTable);
