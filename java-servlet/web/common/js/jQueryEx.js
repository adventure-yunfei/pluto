define(['jquery'], function ($) {
    $.forEach = function forEach(arr, fnCallback) {
        var length = arr.length;
        for (var i = 0; i < length; i++) {
            if (fnCallback(arr[i], i, arr) === false) {
                return;
            }
        }
    };
    $.fn.forEach = function forEach(fnCallback) {
        $.forEach(this, fnCallback);
    };

    $.fn.findAll = function findAll(selector) {
        return this.find(selector)
            .add(this.filter(selector));
    };

    $.expr.pseudos['has-jc-attr'] = function (elem) {
        var attrs = elem.attributes,
            i;
        for (i = 0; i < attrs.length; i++) {
            if (attrs[i].name.startsWith('jc-')) {
                return true;
            }
        }
        return false;
    };

    $.ajaxSetup({
        type: 'POST'
    });

    return $;
});