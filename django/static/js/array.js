define(['$a'], function ($a) {
    return {
        /** Find the index of item in object array which has specified property: item[name] == val */
        search: function (arr, name, val) {
            var resultIdx = -1;
            $.each(arr, function (idx, item) {
                if (item[name] === val) {
                    resultIdx = idx;
                    return false;
                }
            });
            return resultIdx;
        },

        /**
         * Insert new items into existing array
         * @param {Array} arr
         * @param {Array} newItems
         * @param {int} [startIdx]
         */
        insert: function insert(arr, newItems, startIdx) {
            if (startIdx === undefined) {
                startIdx = arr.length;
            }
            Array.prototype.splice.apply(arr, [startIdx, 0].concat(newItems));
            return arr;
        }
    };
});