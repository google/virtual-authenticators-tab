let displayEnabled = enabled => {
    if (enabled)
      chrome.browserAction.setBadgeText({text: 'ON'});
    else
      chrome.browserAction.setBadgeText({text: 'OFF'});
};

chrome.tabs.onActivated.addListener(info => {
  let defaults = {};
  defaults[info.tabId] = {
    enabled: false,
  };
  chrome.storage.local.get(defaults, result => {
    displayEnabled(result[info.tabId].enabled);
  });
});

chrome.debugger.onDetach.addListener(source => {
  let options;
  options[source.tabId] = {
    enabled: false,
  };
  chrome.storage.local.set(options, () => {});
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    if (tabs[0].id == source.tabId)
      displayEnabled(false);
  });
});
