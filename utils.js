function find(arr, total) {
    var i = 0;
    for (; i < arr.length; i++) {
        total -= arr[i];
        if (total <= 0) {
            break;
        }
    }

    return i;
}

module.exports = {
    find: find
};

