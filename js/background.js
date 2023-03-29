"use strict";

// What to do when starting the browser
const ObeyDisabledSettings = true;
bookmarks.remove(ObeyDisabledSettings);

const addBookmark = (tabs) => {
  if (tabs.length == 0) {
    return;
  }

  const tab = tabs[0];
  const info = { index: 0, parentId: "", title: tab.title, url: tab.url };

  storages.get((item) => {
    if (typeof item == "undefined" || item.settings.folderId == "") {
      folders.create((folderId) => {
        info.parentId = folderId;
        bookmarks.create(info, tab.id);
      });
      return;
    }
    info.parentId = item.settings.folderId;
    bookmarks.create(info, tab.id);
  });
};

const onClicked = () => {
  chrome.tabs.query({ currentWindow: true, active: true }, addBookmark);
};

const onCommand = (command) => {
  switch (command) {
    case "add-bookmark":
      onClicked();
      break;
  }
};

chrome.commands.onCommand.addListener(onCommand);
chrome.browserAction.onClicked.addListener(onClicked);
