import {LitElement, html, css} from "lit-element";

class DisplayError extends LitElement {
  static get properties() {
    return {
      errors: {type: Array},
    };
  }

  static get styles() {
    return css`
      .error-row {
        background-color: #FFAAAA;
        border-color: #FF0000;
        border: 3px solid;
        border-radius: 6px;
        color: #990000;
        font-weight: bold;
        padding: 10px;
        margin: 10px;
      }
    `;
  }

  constructor() {
    super();
    this.errors = [];
  }

  render() {
    return html`
      ${this.errors.map(error => {
        try {
          let maybeObject = JSON.parse(error);
          if (maybeObject.message)
            error = maybeObject.message;
        } catch (e) {}
        return html`
          <div class="error-row">${error}</div>
        `;
      })}
    `;
  }
}

customElements.define("display-error", DisplayError);
