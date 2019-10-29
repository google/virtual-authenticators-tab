import {LitElement, html, css} from "lit-element";

class AuthenticatorTable extends LitElement {
  static get properties() {
    return {
      authenticators: { type: Array },
      protocol: { type: String },
      transport: { type: String },
      hasResidentKey: { type: Boolean },
      hasUserVerification: { type: Boolean },
    };
  }

  static get styles() {
    return css`
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
      tbody tr:nth-child(even) {
        background-color: #EEEEEE;
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
          console.error(chrome.runtime.lastError.message);
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
      <table>
        <thead>
          <tr>
            <th class="align-left">ID</th>
            <th class="small-column">Protocol</th>
            <th class="small-column">Transport</th>
            <th class="small-column">Has resident keys</th>
            <th class="small-column">Has user verification</th>
            <th class="small-column"></th>
          </tr>
        </thead>
        <tbody id="authenticator-table-body">
          ${this.authenticators.length === 0 ? html`
            <tr id="empty-table" class="align-center">
              <td colspan="99">
                No Authenticators
              </td>
            </tr>
          ` : html``}
          ${this.authenticators.map(authenticator => html`
            <tr>
              <td class="code">${authenticator.id}</td>
              <td class="align-center">${authenticator.protocol}</td>
              <td class="align-center">${authenticator.transport}</td>
              <td class="align-center">
                <input type="checkbox" disabled
                       ?checked=${authenticator.hasResidentKey}>
              </td>
              <td class="align-center">
                <input type="checkbox" disabled
                       ?checked=${authenticator.hasUserVerification}>
              </td>
              <td class="align-center">
                <button @click=${this.removeAuthenticator.bind(this, authenticator)}">
                  Remove
                </button>
              </td>
            </tr>
            `
          )}
        </tbody>
        <tfoot>
          <tr>
            <td>
            </td>
            <td class="align-center">
              <select .value="${this.protocol}" @input="${this.protocolChanged}">
                <option value="ctap2">ctap2</option>
                <option value="u2f">u2f</option>
              </select>
            </td>
            <td class="align-center">
              <select .value="${this.transport}" @input="${this.transportChanged}">
                <option value="usb">usb</option>
                <option value="nfc">nfc</option>
                <option value="ble">ble</option>
                <option value="internal">internal</option>
              </select>
            </td>
            <td class="align-center">
              <input type="checkbox" .checked=${this.hasResidentKey}
                     @input="${this.hasResidentKeyChanged}" name="has-rk">
            </td>
            <td class="align-center">
              <input type="checkbox" .checked="${this.hasUserVerification}"
                     @input="${this.hasUserVerificationChanged}" name="has-uv">
            </td>
            <td>
              <button @click="${this.addAuthenticator}">Add</button>
            </td>
          </tr>
        </tfoot>
      </table>
    `;
  }
}

customElements.define("authenticator-table", AuthenticatorTable);
