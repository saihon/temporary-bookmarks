'use strict';

chrome.storage.sync.get(STORAGE_KEY, (item) => {
    document.formSelect.expiration.selectedIndex = item.settings.key;
});

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

document.getElementById('delete-button')
    .addEventListener("click", deleteBookmark, false);