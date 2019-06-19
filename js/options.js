'use strict';

chrome.storage.sync.get(STORAGE_KEY, (item) => {
    document.formCheck.disable.checked           = item.settings.disable;
    document.formSelect.expiration.selectedIndex = item.settings.key;
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

document.getElementById('delete-button')
    .addEventListener("click", deleteBookmark, false);