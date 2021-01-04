'use strict';

// What to do when starting the browser
const ObeyDisabledSetting = true;
deleteBookmarks(ObeyDisabledSetting);

const createFolder = (callback) => {
    chrome.bookmarks.create({title : FOLDER_NAME, index : 0}, (result) => {
        chrome.storage.sync.get(STORAGE_KEY, (item) => {
            item.settings.folderId = result.id;
            chrome.storage.sync.set(item);
            if (callback) callback(item.settings.folderId);
        });
    });
};

// create bookmark and displays badge (hide after 1400 milliseconds) to toolbar
// button.
const createBookmark = (info, tabId, recover) => {
    // If not specify info.index in firefox, it will be in alphabet order,
    // so get the children length, for the add to the end of the folder.
    chrome.bookmarks.getChildren(info.parentId, (children) => {
        // If an error occurs, recover only once.
        // It error is probably due to can not be find the folder id.
        if (recover !== true && chrome.runtime.lastError) {
            createFolder((folderId) => {
                info.parentId = folderId;
                createBookmark(info, tabId, true);
            });
            return;
        }

        info.index = children.length;

        chrome.bookmarks.create(info, (node) => {
            if (chrome.runtime.lastError) {
                return;
            }

            setTimeout(() => {
                chrome.browserAction.setBadgeText({text : '', tabId : tabId});
            }, 1400);

            chrome.browserAction.setBadgeText({text : '+', tabId : tabId});
            chrome.browserAction.setBadgeBackgroundColor(
                {color : [ 255, 255, 60, 255 ], tabId : tabId});
        });
    });
};

const getCurrentTab = (tabs) => {
    if (tabs.length == 0) {
        return;
    }

    const tab  = tabs[0];
    const info = {index : 0, parentId : '', title : tab.title, url : tab.url};

    chrome.storage.sync.get(STORAGE_KEY, (item) => {
        if (item.settings.folderId == '') {
            createFolder((folderId) => {
                info.parentId = folderId
                createBookmark(info, tab.id, false);
            });
            return;
        }

        info.parentId = item.settings.folderId;
        createBookmark(info, tab.id, false);
    });
};

const onClicked = () => {
    chrome.tabs.query({currentWindow : true, active : true}, getCurrentTab);
};

chrome.browserAction.onClicked.addListener(onClicked);
