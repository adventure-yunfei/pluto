define(['$a', '$a/array'], function ($a, array) {
    var newItemPrefix = /** Prefix of "id" when insert a new item(e.g. Section, Entry) when editing */ 'new_',
        newItemCount = /** Count of new inserted items */ 0;
    return {
        getNextNewId: function getNextNewId() {
            return newItemPrefix + (++newItemCount);
        },

        /**
         * Find changes from newData compared to oldData
         * Each info in data array must contain unique "id" (valid int or temporary start with newItemPrefix)
         * @param {Array.<{}>} oldData
         * @param {Array.<{}>} newData
         * @returns {{insert: Array, update: Array, remove: Array}}
         */
        getChanges: function getChanges(oldData, newData) {
            var changes = {
                    insert: /** Contains props (except id, or contains temp ID with "new_" prefix) */ [],
                    update: /** Contains all props */ [],
                    remove: /** Contains only id prop */ []
                };
            $.each(newData, function (idx, newOne) {
                var appearInOldIdx = array.search(oldData, 'id', newOne.id);
                if (appearInOldIdx === -1) {
                    // Check for insert
                    $a.assert(newOne.id.indexOf(newItemPrefix) > -1, 'EditUtils.getChanges: new id (' + newOne.id + ') appears in latest data, but it\'s not prefixed with ' + newItemPrefix);
                    changes.insert.push(newOne);
                } else {
                    // Check for update
                    if (!$a.isEqual(newOne, oldData[appearInOldIdx])) {
                        changes.update.push(newOne);
                    }
                }
            });
            // Check for remove
            changes.remove = $.map(oldData, function (oldOne) {
                return (array.search(newData, 'id', oldOne.id) === -1) ? oldOne.id : null;
            });
            return changes;
        }
    };
});