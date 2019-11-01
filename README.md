Virtual Authenticators Tab
==========================

## Introduction

A Google Chrome extension for developers that adds a virtual authenticators tab
to devtools, allowing you to try WebAuthn without physical security keys.

This extension will work best on Chrome 80 onwards, but you can still try it on
78 and 79.

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

## Author

Nina Satragno <nso@google.com>

This is not an officially supported Google product
