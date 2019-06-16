'use strict';

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