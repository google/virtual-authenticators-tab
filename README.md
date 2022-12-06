Virtual Authenticators Tab
==========================

Deprecated
==========

This extension has been deprecated in favour of the [Chrome Devtools WebAuthn tab](https://developer.chrome.com/docs/devtools/webauthn/), which provides more functionality, is included with chrome, and is more polished. This repository is no longer maintained.

![virtual authenticators tab icon](/assets/icon.png?raw=true)

## Introduction

A Google Chrome extension for developers that adds a virtual authenticators tab
to devtools, allowing you to debug and try WebAuthn without physical security keys.

This extension will work best on Chrome 80 onwards, but you can still try it on
78 and 79.

## Download

[The extension is available at the chrome web store](
https://chrome.google.com/webstore/detail/virtual-authenticators-ta/gafbpmlmeiikmhkhiapjlfjgdioafmja)

## Development

To try the extension locally,

1. Install the dependencies
```
npm install
```

2. Generate the main module
```
npm run dev
```

3. [Load the extension as an unpacked extension](
   https://developer.chrome.com/extensions/getstarted)

## Building for release

```
npm run build
```

Will produce a zip file suitable for upload to the chrome web store.

## Authors

Alexander Bradt <abradt@google.com>

Nina Satragno <nso@google.com>

## Disclaimer

This is not an officially supported Google product
