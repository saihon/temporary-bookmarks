'use strict';

///////////////////////
// Delete buttun
///////////////////////
let counter;

class Counter {
    constructor(folderId, expirationKey) {
        this.element = document.getElementById('count');
    }
    reset() {
        this.element.textContent = '0';
    }
    count(id) {
        this.element.textContent = ((this.element.textContent - 0) + 1) + '';
    }
}

chrome.storage.sync.get(STORAGE_KEY, (item) => {
    document.formCheck.disable.checked   = item.settings.disable;
    document.formNumber.expiration.value = item.settings.day - 0;

    counter = new Counter();

    walkfolders(item.settings.folderId,
                Date.now(),
                item.settings.day * DAY_MS,
                counter.count.bind(counter));
});

const clickedDeleteButton = () => {
    counter.reset();
    const ObeyDisabledSetting = false;
    deleteBookmarks(ObeyDisabledSetting);
    setTimeout(() => {
        chrome.storage.sync.get(STORAGE_KEY, (item) => {
            walkfolders(item.settings.folderId,
                        Date.now(),
                        item.settings.day * DAY_MS,
                        counter.count.bind(counter));
        });
    }, 1000);
};

document.getElementById('delete-button')
    .addEventListener("click", clickedDeleteButton, false);

///////////////////////////////
// disable checkbox
///////////////////////////////
const changedDisableCheckbox = (e) => {
    e.preventDefault();
    chrome.storage.sync.get(STORAGE_KEY, (item) => {
        if (!item.settings) return;
        item.settings.disable = document.formCheck.disable.checked;
        chrome.storage.sync.set(item);
    });
};

document.formCheck.disable.addEventListener(
    'change', changedDisableCheckbox, false);

////////////////////////////////
// expiration number
////////////////////////////////
const validateInteger = (value) => {
    const n    = value - 0;
    let result = false;
    try {
        result = Number.isInteger(n) && n > 0
    } catch (e) {
        console.error(e);
    }
    return result;
};

const changedExpirationNumber = () => {
    if (!validateInteger(document.formNumber.expiration.value)) {
        return;
    }

    chrome.storage.sync.get(STORAGE_KEY, (item) => {
        if (!item.settings) return;
        item.settings.day = document.formNumber.expiration.value;
        chrome.storage.sync.set(item);
    });
};

const onChanged = (e) => {
    e.preventDefault();
    changedExpirationNumber();
};

document.formNumber.expiration.addEventListener("change", onChanged, false);

/////////////////////////////////
// When closing the options page
/////////////////////////////////
const onUnload = () => {
    changedExpirationNumber();
};

addEventListener("onunload", onUnload, false);