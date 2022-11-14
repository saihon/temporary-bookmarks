
// https://developer.chrome.com/docs/extensions/reference/storage/
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage
const storages = (new class Storages {
    constructor() {
        this._KEY              = 'settings';
        this._DEFAULT_SETTINGS = Object.freeze({
            day : 30, // 1 month
            folderId : '',
            disable : false,
        });

        // local or sync
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage#properties
        this._PROP_NAME = 'sync';
    }

    get(callback) {
        const self = this;
        chrome.storage[self._PROP_NAME].get(self._KEY, (item) => {
            if (!item[self._KEY]) {
                item[self._KEY] = self._DEFAULT_SETTINGS;
                self.set(item);
            }

            // "settings.day" is a new property, so may not have.
            if (!item[self._KEY]['day']) {
                item['day'] = self._DEFAULT_SETTINGS.day;
                self.set(item);
            }

            if (typeof callback != 'undefined') callback(item);
        });
    }

    set(item) {
        chrome.storage[this._PROP_NAME].set(item);
    }
}());

// https://developer.chrome.com/docs/extensions/reference/bookmarks/
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks
const folders = (new class Folders {
    constructor() {
        this._NAME = 'Temporary Bookmarks';
    }

    create(callback) {
        const self = this;
        // https://developer.chrome.com/docs/extensions/reference/bookmarks/#method-create
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks/CreateDetails
        // If url is NULL or missing, it will be a folder.
        chrome.bookmarks.create({title : self._NAME, index : 0}, results => {
            storages.get(item => {
                item.settings.folderId = results.id;
                storages.set(item);
                if (typeof callback != 'undefined')
                    callback(item.settings.folderId);
            });
        });
    }

    walk(folderId, timeInMs, expirationMs, fn) {
        if (!folderId) {
            return;
        }

        const self = this;

        // https://developer.chrome.com/docs/extensions/reference/bookmarks/#method-getChildren
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks/getChildren
        chrome.bookmarks.getChildren(folderId, children => {
            // when not an error, runtime.lastError is undefined in chrome
            // and null in firefox
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
                    self.walk(c.id, timeInMs, expirationMs, fn);
                    continue;
                }

                let elapsedMs = timeInMs - c.dateAdded;
                if (elapsedMs > expirationMs) {
                    fn(c.id);
                }
            }
        });
    }
}());

// https://developer.chrome.com/docs/extensions/reference/browserAction/#badge
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction
const BADGE_COLOR = Object.freeze({
    blue : [ 0, 51, 204, 255 ],
    yellow : [ 255, 255, 60, 255 ],
});

function badgeText(details) {
    // https://developer.chrome.com/docs/extensions/reference/browserAction/#method-setBadgeText
    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/setBadgeText
    chrome.browserAction.setBadgeText(details);
}

function badgeIncrement() {
    // https://developer.chrome.com/docs/extensions/reference/browserAction/#method-getBadgeText
    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/getBadgeText
    chrome.browserAction.getBadgeText(
        {}, text => { badgeText({text : ((text - 0) + 1) + ''}); });
}

function badgeColor(details) {
    // https://developer.chrome.com/docs/extensions/reference/browserAction/#method-setBadgeBackgroundColor
    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/setBadgeBackgroundColor
    chrome.browserAction.setBadgeBackgroundColor(details);
}

function badgeReset(details, timeout) {
    if (!details) {
        details = {};
    }
    details['text'] = '';

    if (timeout) {
        setTimeout(() => {badgeText(details)}, timeout);
        return;
    }
    badgeText(details);
}

const DAY_MILLISECONDS = 86400000; // 1 day millisecond

const BADGE_RESET_MILLISECONDS = 1000 * 60; // 1 min

// https://developer.chrome.com/docs/extensions/reference/bookmarks/
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks
const bookmarks = (new class Bookmarks {
    constructor() {}

    _removeOne(id) {
        // https://developer.chrome.com/docs/extensions/reference/bookmarks/#method-remove
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks/remove
        chrome.bookmarks.remove(id, () => {
            if (chrome.runtime.lastError) return;
            badgeIncrement();
        });
    }

    // obeyDisabledSettings: specify false when deleting with the "Delete"
    // button on the setting page.
    remove(obeyDisabledSettings) {
        const self = this;

        // Delete expired bookmarks.
        storages.get(item => {
            if (obeyDisabledSettings && item.settings.disable) {
                return;
            }

            if (item.settings.folderId == '') {
                return;
            }

            badgeColor({color : BADGE_COLOR.blue});

            folders.walk(item.settings.folderId,
                         Date.now(),
                         item.settings.day * DAY_MILLISECONDS,
                         self._removeOne);

            badgeReset(null, BADGE_RESET_MILLISECONDS);
        });
    }

    create(info, tabId, recovered) {
        const self = this;
        // If not specify info.index in firefox, it will be in alphabet order,
        // so get the children length, for the add to the end of the folder.
        chrome.bookmarks.getChildren(info.parentId, children => {
            // If an error occurs, recover only once.
            // It error is probably due to can not be find the folder id.
            if (!recovered && chrome.runtime.lastError) {
                folders.create(folderId => {
                    info.parentId = folderId;
                    self.create(info, tabId, true);
                });
                return;
            }

            info.index = children.length;

            // https://developer.chrome.com/docs/extensions/reference/bookmarks/#method-create
            // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks/create
            chrome.bookmarks.create(info, node => {
                if (chrome.runtime.lastError) {
                    return;
                }

                badgeColor({color : BADGE_COLOR.yellow, tabId : tabId});
                badgeText({text : '+', tabId : tabId});
                badgeReset({tabId : tabId}, 1400);
            });
        });
    }
}());
