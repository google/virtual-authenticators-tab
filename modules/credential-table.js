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
      .empty-table {
        background-color: #EEEEEE;
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

  attributeChangedCallback(name, _, value) {
    if (name !== "authenticatorid" || !value)
      return;

    this.intervalHandle = window.setInterval(() => {
      console.log("polling for credentials");
      chrome.debugger.sendCommand(
        {tabId: this.tabId}, "WebAuthn.getCredentials",
        {authenticatorId: value},
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

  render() {
    return html`
      <h4>Credentials</h4>
      <table>
        <thead>
          <tr>
            <th class="align-left">ID</th>
            <th class="small-column">Is Resident Credential</th>
            <th class="small-column">RP ID</th>
            <th class="small-column">User Handle</th>
            <th class="small-column">Sign Count</th>
            <th class="small-column"></th>
          </tr>
        </thead>
        <tbody>
          ${this.credentials.length === 0 ? html`
            <tr class="align-center empty-table">
              <td colspan="99">
                No Credentials
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
                <button @click="${this.removeCredential.bind(this, credential)}">
                  Remove
                </button>
              </td>
            </tr>
         `)}
        </tbody>
      </table>
    `;
  }
}

customElements.define("credential-table", CredentialTable);
