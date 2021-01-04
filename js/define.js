'use strict';

const STORAGE_KEY = "settings";

const FOLDER_NAME = "Temporary Bookmarks";

const DAY_MS = 86400000; // 1 day millisecond

const DEFAULT_SETTINGS = {
    // key : 4, // delete this property
    day : 30, // 1 month
    folderId : '',
    disable : false,
};

const walkfolders = (folderId, timeInMs, expirationMs, callback) => {
    if (!folderId) {
        return;
    }
    chrome.bookmarks.getChildren(folderId, (children) => {
        // when not an error, runtime.lastError is undefined in chrome and
        // null in firefox
        if (chrome.runtime.lastError) {
            return;
        }

        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks/BookmarkTreeNode
        // node is created BookmarkTreeNode.
        // Verified that node.dateAdded and Date.now() return the same
        // value. console.log("dateAdded:", node.dateAdded);
        // console.log("Date now :", Date.now());

        for (let c of children) {
            // If child is a folder,
            // url is `undefined` on both chrome and firefox.
            if (typeof c['url'] == 'undefined') {
                walkfolders(c.id, timeInMs, expirationMs, callback);
                continue;
            }

            let elapsedMs = timeInMs - c.dateAdded;
            if (elapsedMs > expirationMs) {
                callback(c.id);
            }
        }
    });
};

const _deleteOne = (id) => {
    chrome.bookmarks.remove(id, () => {
        if (chrome.runtime.lastError) {
            return;
        }
        chrome.browserAction.getBadgeText({}, (text) => {
            chrome.browserAction.setBadgeText({text : ((text - 0) + 1) + ''});
        });
    });
};

const deleteBookmarks = (obeyDisabled) => {
    // Delete expired bookmarks.
    chrome.storage.sync.get(STORAGE_KEY, (item) => {
        if (!item[STORAGE_KEY]) {
            item[STORAGE_KEY] = DEFAULT_SETTINGS;
            chrome.storage.sync.set(item);
        }

        // "settings.day" is a new property, so may not have.
        if (!item[STORAGE_KEY]["day"]) {
            item['day'] = DEFAULT_SETTINGS.day;
            chrome.storage.sync.set(item);
        }

        if (obeyDisabled && item.settings.disable) {
            return;
        }

        if (item.settings.folderId == '') {
            return;
        }

        chrome.browserAction.setBadgeBackgroundColor(
            {color : [ 0, 51, 204, 255 ]});

        walkfolders(item.settings.folderId,
                    Date.now(),
                    item.settings.day * DAY_MS,
                    _deleteOne);

        setTimeout(() => {
            chrome.browserAction.setBadgeText({text : ''});
        }, 1000 * 60); // 1 minutes
    });
};
