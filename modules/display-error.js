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
