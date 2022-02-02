'use strict';

///////////////////////
// Delete buttun
///////////////////////

const counter = (new class Counter {
    constructor() {
        this.element = document.getElementById('count');
    }
    reset() {
        this.element.textContent = '0';
    }
    count(id) {
        this.element.textContent = ((this.element.textContent - 0) + 1) + '';
    }
}());

storages.get(item => {
    document.formCheck.disable.checked   = item.settings.disable;
    document.formNumber.expiration.value = item.settings.day - 0;
    folders.walk(item.settings.folderId,
                 Date.now(),
                 item.settings.day * DAY_MILLISECONDS,
                 counter.count.bind(counter));
});

const clickedDeleteButton = () => {
    counter.reset();

    // Specifying false, can delete the bookmark even if "Disable Delete" is on.
    const obeyDisabledSettings = false;
    bookmarks.remove(obeyDisabledSettings);

    setTimeout(() => {
        storages.get(item => {
            folders.walk(item.settings.folderId,
                         Date.now(),
                         item.settings.day * DAY_MILLISECONDS,
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
    storages.get(item => {
        if (!item.settings) return;
        item.settings.disable = document.formCheck.disable.checked;
        storages.set(item);
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

    storages.get(item => {
        if (!item.settings) return;
        item.settings.day = document.formNumber.expiration.value;
        storages.set(item);
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