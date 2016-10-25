define(['cm/jQueryEx'], function ($) {
    function ensureArray(input) {
        return $.isArray(input) ? input : [ input ];
    }

    var uniqueIdCnd = 0;

    return {
        ensureArray: ensureArray,

        /**
         * @param {Object || Array.<Object>} sources
         * @param {Object} dest
         */
        copy: function copy(sources, dest) {
            dest = dest || {};

            $.forEach(ensureArray(sources), function (srcObj) {
                $.each(srcObj, function (key, val) {
                    dest[key] = val;
                });
            });

            return dest;
        },

        bindPromiseState: function bindPromiseState(sourcePromise, targetPromise) {
            sourcePromise.done(function () {
                targetPromise.resolveWith(this, arguments);
            }).fail(function () {
                targetPromise.rejectWith(this, arguments);
            }).progress(function () {
                targetPromise.notifyWith(this, arguments);
            })
        },

        uniqueId: function getUniqueId(prefix) {
            return (prefix || '') + (++uniqueIdCnd).toString();
        }
    }
});