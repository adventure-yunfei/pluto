define(['$a', 'jClass'], function ($a, jClass) {
    /** @this BaseHelper */
    function findTargets(selectorOrTargets, rootNode) {
        return $a.isString(selectorOrTargets) ? this.find(selectorOrTargets, rootNode) : selectorOrTargets;
    }

    /**
     * @class BaseHelper
     */
    return jClass.declare(null, null, {
        /** Dom node of the helper */
        node: null,

        /**
         * Helper ID
         * @type string
         */
        hid: '',

        /**
         * Called when init.
         * Note that this function may called manually when node changes,
         * So make sure function handlers are fixed instead of anonymous functions locally created every time,
         * so that calling "on" to bind event for one handler multiple times will actually bind once
         * @type Function
         * @param {HTMLElement|jQuery} [jRootNode] If specified, event binding targets will be found within the nodes (Default within helper root node)
         */
        initEventBinding: null,

        /**
         * @param {HTMLElement} node Required. Dom node is needed for any helper
         * @param {Object} [props] Extra props that will each set on new helper
         */
        $constructor: function constructor(node, props) {
            if (!node) {
                $a.error('BaseHelper.$constructor: Parameter "node" is required!');
            }
            this.node = node;

            for (var key in props) {
                this[key] = props[key];
            }

            if (this.initEventBinding) {
                this.initEventBinding();
            }
        },

        /**
         * Call jQuey bind events (ensure bind only once for the same handler), extra bind this to handler
         * @param {string | jQuery} selectorOrTargets Pass selector to find under helper root node, or directly pass target nodes
         * @param {string} events
         * @param {Function | False} handler
         * @param {Object} [data]
         * @param {HTMLElement|jQuery} [jSelectorRootNode] If specified and selectorOrTargets is string (as selector), event targets will be (root) found in these nodes. (Default do find under helper root node)
         */
        on: function on(selectorOrTargets, events, handler, data, jSelectorRFindNode) {
            var eventTargets = findTargets.call(this, selectorOrTargets, jSelectorRFindNode);
            handler = handler === false ? handler : handler.bind(this);
            if (data) {
                eventTargets.on(events, data, handler);
            } else {
                eventTargets.on(events, handler);
            }
        },

        find: function find(selector, rootNode) {
            return $(rootNode || this.node).rfind(selector);
        },

        /**
         * Set property of this helper. Call corresponding onchange func if needed.
         * @param {string} name Property name that will be set
         * @param {*} value Property value that will be set
         * @param {boolean} [forceChange] Whether to force to call onchange func
         */
        set: function set(name, value, forceChange) {
            var oldValue = this[name];
            this[name] = value;

            if (forceChange || oldValue !== value) {
                var f = this['on' + name + 'Change'];
                if (typeof f === 'function') {
                    f.call(this, oldValue);
                }
            }
        }
    });
});
