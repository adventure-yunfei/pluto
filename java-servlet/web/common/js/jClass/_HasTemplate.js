define(['cm/jQueryEx', 'hogan'], function ($) {
    var PROP_TEMPLATE = '_tpl',
        PROP_SLOTS = '_slots';

    /**@this {_HasTemplate} */
    function getRenderedHTML() {
        var mergedTplCfg = this.templateConfig;
        if (!mergedTplCfg.hasOwnProperty(PROP_TEMPLATE)) {
            var html = mergedTplCfg.html;
            mergedTplCfg[PROP_TEMPLATE] = Hogan.compile(html);
        }

        return mergedTplCfg[PROP_TEMPLATE].render(this, mergedTplCfg);
    }


    var fnBindProp/**Used for bind attribute, style, inner-html */ = function fnBindProp(jqueryMethodName, name, valueExp, node, widget) {
            valueExp = valueExp.split(':');
            var bindProp = valueExp[0],
                bindValFnName = valueExp[1],
                handler = function () {
                    var args = (name ? [ name ] : []).concat(bindValFnName ? widget[bindValFnName]() : widget[bindProp]),
                        jNode = $(node);
                    jNode[jqueryMethodName].apply(jNode, args);
                };

            // Add event
            widget.on(widget.getPropChangeEventType(bindProp), handler);
            // Execute handler on node for initializing
            handler();
        },
        propBindMap = {
            'jc-events': function bindEvent(empty, events, node, widget) {
                var jNode = $(node);
                $.forEach(events.split(' '), function (evtType) {
                    jNode.on(evtType, function (jqEvt) {
                        widget.trigger(jqEvt);
                    });
                });
            },
            'jc-bind-attr-': function bindAttr(attrName, valueExp, node, widget) {
                fnBindProp('attr', attrName, valueExp, node, widget);
            },
            'jc-bind-style-': function bindStyle(styleName, valueExp, node, widget) {
                fnBindProp('css', styleName, valueExp, node, widget);
            },
            'jc-bind-html': function bindStyle(empty, valueExp, node, widget) {
                fnBindProp('html', null, valueExp, node, widget);
            },
            'jc-slot': function markSlot(empty, slotName, node, widget) {
                widget[PROP_SLOTS][slotName] = node;
            }
        };
    /**@this {_HasTemplate} */
    function setupBindingsAndSlots() {
        var me = this;
        this.jNode.findAll(':has-jc-attr').forEach(function (node) {
            $.forEach(node.attributes, function (attr) {
                var attrName = attr.name;
                $.forEach(propBindMap, function (fnBind, prefix) {
                    if (attrName.startsWith(prefix)) {
                        fnBind(attrName.replace(prefix, ''), attr.value, node, me);
                    }
                });
            });
        });
    }
    /**@this {_HasTemplate} */
    function resetSlots() {
        this[PROP_SLOTS] = {};
    }

    return {
        constr: function constr() {
            resetSlots.call(this);
        },

        /**
         * Config for rendering template. Contains a base html markup - "html" and each block template. (Blocks are corresponding to partials in Hogan.js template
         * Each template config on each mixin/class props/instance props are merged together
         * Sample:
         *  Base.prototype.templateConfig:
         *      {
         *          html: '<div>{{> block_content}}</div>',
         *          block_content': 'some content {{> block_subContent}}'
         *      }
         *  Sub.prototype.templateConfig:
         *      {
         *          block_subContent: 'some content from Sub'
         *      }
         *
         * @type {{html: string}}
         */
        templateConfig: {},

        jNode: null,

        hasRendered: false,

        render: function render() {
            if (DEBUG) { jcAssert(!this.hasRendered, 'Cannot call render() when already rendered!'); }

            this.jNode = $(getRenderedHTML.call(this));
            setupBindingsAndSlots.call(this);

            this.hasRendered = true;
        },

        renderTo: function renderTo(containerNode) {
            this.render();
            this.jNode.appendTo(containerNode);
        },

        unrender: function unrender() {
            if (DEBUG) { jcAssert((this.hasRendered, 'Cannot call unrender() when not rendered yet!'))}

            if (this.hasRendered) {
                resetSlots.call(this);
                this.jNode.remove();
                this.jNode = null;

                this.hasRendered = false;
            }
        },

        getSlot: function getSlot(slotName) {
            if (DEBUG) { jcAssert(this[PROP_SLOTS][slotName], 'Slot does not exist'); }

            return this[PROP_SLOTS][slotName];
        }
    };
});