define(['cm/jQueryEx'], function ($) {
    /** Use together with _HasTemplate */
    return {
        /**
         * @type {Array.<Object>} Children as class instance or instance config
         */
        children: null,

        constr: function () {
            if (!this.children) {
                this.children = [];
            }

            $.forEach(this.children, function (child, idx, children) {
                if (!(child instanceof child.Class)) {
                    children[idx] = new child.Class(child);
                }
            })
        },

        render: function render() {
            this.Super();

            var me = this;
            $.forEach(this.children, function (child) {
                child.renderTo(me.getSlot(child.slot));
            });
        },

        unrender: function unrender() {
            this.Super();

            $.forEach(this.children, function (child) {
                child.unrender();
            });
        }
    };
});