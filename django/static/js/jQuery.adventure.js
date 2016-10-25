(function () {
    window.$ = jQuery;
    $.id = function findById(id) { return $('#' + id); };

    $.fn.nodes = function domNodes() { return $.map(this, function (node) { return node; }); };

    $.fn.isNotEmpty = function isNotEmpty() { return (this.length > 0); };
    $.fn.isEmpty = function isEmpty() { return !this.isNotEmpty(); };
    $.fn.onlyOne = function onlyOne() { return this.length === 1; };

    $.fn.rfind = function rootFind(selector) {
        return this.filter(selector).add(this.find(selector));
    };

    $.fn.trimText = function trimText() {
        return $.trim(this.text());
    };

    $.fn.serializeJSONObject = function serializeJSONObject() {
        // **Serialize form data to json-format object.
        var result = {};
        $.each(this.serializeArray(), function () {
            var name = this.name,
                value = this.value;
            if (result[name] === undefined) {
                result[name] = value;
            } else {
                if (!($.isArray(result))) {
                    result[name] = [result[name]];
                }
                result[name].push(value);
            }
        });

        return result;
    };

    /**
     * Center align element with specified options.
     * @param {DomNode,jQuery} container The container that element will center align to (default to window). If window, it'll be positioned fixed
     * @param {boolean} noHorizon Whether stop center align for horizon (default to apply)
     * @param {boolean} noHorizon Whether stop center align for vertical (default to apply)
     */
    $.fn.center = function center(container, noHorizon, noVertical) {
        container = $(container || window);
        this.css('position', container[0] === window ? 'fixed' : 'absolute');
        if (!noHorizon) {
            this.css('left', (container.width() - this.outerWidth()) / 2);
        }
        if (!noVertical) {
            this.css('top', (container.height() - this.outerHeight()) / 2);
        }
        return this;
    };
}());