'use strict';

let counter;

class Counter {
    constructor(folderId, expirationKey) {
        this.element = document.getElementById('count');
    }

    foo() {
        return this;
    }

    reset() {
        this.element.textContent = '0';
    }

    count(id) {
        this.element.textContent = ((this.element.textContent - 0) + 1) + '';
    }
}

chrome.storage.sync.get(STORAGE_KEY, (item) => {
    document.formCheck.disable.checked           = item.settings.disable;
    document.formSelect.expiration.selectedIndex = item.settings.key;

    counter = new Counter();

    walkfolders(item.settings.folderId,
                Date.now(),
                EXPIRATION_TIMES[item.settings.key],
                counter.count.bind(counter));
});

let changedDisableCheckbox = (e) => {
    e.preventDefault();
    chrome.storage.sync.get(STORAGE_KEY, (item) => {
        if (!item.settings) return;
        item.settings.disable = document.formCheck.disable.checked;
        chrome.storage.sync.set(item);
    });
};

document.formCheck.disable.addEventListener(
    'change', changedDisableCheckbox, false);

let changedExpirationSelect = (e) => {
    e.preventDefault();
    chrome.storage.sync.get(STORAGE_KEY, (item) => {
        if (!item.settings) return;
        item.settings.key = document.formSelect.expiration.selectedIndex;
        chrome.storage.sync.set(item);
    });
};

document.formSelect.expiration.addEventListener(
    "change", changedExpirationSelect, false);

let clickedDeleteButton = () => {
    counter.reset();
    deleteBookmarks(false);
    setTimeout(() => {
        chrome.storage.sync.get(STORAGE_KEY, (item) => {
            walkfolders(item.settings.folderId,
                        Date.now(),
                        EXPIRATION_TIMES[item.settings.key],
                        counter.count.bind(counter));
        });
    }, 1000);
};

document.getElementById('delete-button')
    .addEventListener("click", clickedDeleteButton, false);