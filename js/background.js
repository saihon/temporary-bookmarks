'use strict';

let deleteBookmark = (timeInMs, expirationMs, folderId) => {
    chrome.bookmarks.getChildren(folderId, (children) => {
        // when not an error, runtime.lastError is undefined in chrome and null
        // in firefox
        if (chrome.runtime.lastError) {
            return;
        }

        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks/BookmarkTreeNode
        // node is created BookmarkTreeNode.
        // Verified that node.dateAdded and Date.now() return the same value.
        // console.log("dateAdded:", node.dateAdded);
        // console.log("Date now :", Date.now());

        for (let c of children) {
            // If child is a folder,
            // url is `undefined` on both chrome and firefox.
            if (typeof c['url'] == 'undefined') {
                deleteBookmark(timeInMs, expirationMs, c.id);
                continue;
            }

            let elapsedMs = timeInMs - c.dateAdded;
            if (elapsedMs > expirationMs) {
                chrome.bookmarks.remove(c.id, () => {
                    if (chrome.runtime.lastError) {
                        return;
                    }
                    chrome.browserAction.getBadgeText({}, (text) => {
                        chrome.browserAction.setBadgeText(
                            {text : ((text - 0) + 1) + ''});
                    });
                });
            }
        }
    });
};

// Delete expired bookmarks.
chrome.storage.sync.get('settings', (item) => {
    if (!item.settings) {
        item['settings'] = DEFAULT_SETTINGS;
        chrome.storage.sync.set(item);
    }

    if (item.settings.folderId == '') {
        return;
    }

    chrome.browserAction.setBadgeBackgroundColor({color : [ 0, 51, 204, 255 ]});

    deleteBookmark(Date.now(),
                   EXPIRATION_TIMES[item.settings.key],
                   item.settings.folderId);

    setTimeout(() => {
        chrome.browserAction.setBadgeText({text : ''});
    }, 1000 * 60); // 1 minutes
});

let createFolder = (callback) => {
    chrome.bookmarks.create({title : FOLDER_NAME, index : 0}, (result) => {
        chrome.storage.sync.get('settings', (item) => {
            item.settings.folderId = result.id;
            chrome.storage.sync.set(item);
            if (callback) callback(item.settings.folderId);
        });
    });
};

// create bookmark and displays badge (hide after 1400 milliseconds) to toolbar
// button.
let createBookmark = (info, tabId, recover) => {
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

let getCurrentTab = (tabs) => {
    if (tabs.length == 0) {
        return;
    }

    let tab = tabs[0];

    let info = {index : 0, parentId : '', title : tab.title, url : tab.url};

    chrome.storage.sync.get('settings', (item) => {
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

let onClicked = () => {
    chrome.tabs.query({currentWindow : true, active : true}, getCurrentTab);
};

chrome.browserAction.onClicked.addListener(onClicked);
