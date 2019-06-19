'use strict';

let STORAGE_KEY = "settings";

let FOLDER_NAME = "Temporary Bookmarks";

// key to milliseonds
let EXPIRATION_TIMES = {
    0 : 86400000,      // 1 day
    1 : 86400000 * 3,  // 3 day
    2 : 86400000 * 7,  // 1 week
    3 : 86400000 * 21, // 3 week
    4 : 86400000 * 30, // 1 month
    5 : 86400000 * 90, // 3 month
};

let DEFAULT_SETTINGS = {
    key : 4, // 1month
    folderId : '',
    disable : false,
};

let _deleteBookmarkRecursively = (timeInMs, expirationMs, folderId) => {
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
                _deleteBookmarkRecursively(timeInMs, expirationMs, c.id);
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

let deleteBookmark = () => {
    // Delete expired bookmarks.
    chrome.storage.sync.get(STORAGE_KEY, (item) => {
        if (!item.settings) {
            item[STORAGE_KEY] = DEFAULT_SETTINGS;
            chrome.storage.sync.set(item);
        }

        if (item.settings.disable) {
            return;
        }

        if (item.settings.folderId == '') {
            return;
        }

        chrome.browserAction.setBadgeBackgroundColor(
            {color : [ 0, 51, 204, 255 ]});

        _deleteBookmarkRecursively(Date.now(),
                                   EXPIRATION_TIMES[item.settings.key],
                                   item.settings.folderId);

        setTimeout(() => {
            chrome.browserAction.setBadgeText({text : ''});
        }, 1000 * 60); // 1 minutes
    });
};

((disabled) => {
    if (disabled) return;
    // Verified that BookmarkTreeNode.dateAdded and Date.now() return the
    // same value.
    //
    // here is the test whether each EXPIRATION_TIMES is correct.
    //
    let date     = new Date();
    let timeInMs = date.getTime();

    let testData = [
        {addDate : 1, expect : timeInMs + EXPIRATION_TIMES[0]},
        {addDate : 3, expect : timeInMs + EXPIRATION_TIMES[1]},
        {addDate : 7, expect : timeInMs + EXPIRATION_TIMES[2]},
        {addDate : 21, expect : timeInMs + EXPIRATION_TIMES[3]},
        {addDate : 30, expect : timeInMs + EXPIRATION_TIMES[4]},
        {addDate : 90, expect : timeInMs + EXPIRATION_TIMES[5]},
    ];

    for (let i = 0; i < testData.length; i++) {
        let v     = testData[i];
        let _date = new Date(date);
        _date.setDate(_date.getDate() + v.addDate);
        let actual = _date.getTime();

        if (actual !== v.expect) {
            console.error('%d: got : %d, want: %d', i, actual, v.expect);
            return;
        }
    }
    console.log("All tests passed.");
})(typeof process == 'undefined' ||
   process.argv[process.argv.length - 1] != 'test');