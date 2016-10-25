////////////////////////////////////////////////////////////////////////////////////////
////    Global object adventure.    ////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
define(['$a/math'], function ($math) {
    var helperIDCount = 1,
        helperIdStr = 'helperId',
        helperIdAttrSelector = '[' + helperIdStr + ']';

    function getNextAutoHelperId() {
        return 'adv' + helperIDCount++;
    }

    window.$a = window.adventure = {
        helpers: {},        // Save references to js helper object for dom node. The key is dom node id.

        emptyFunc: function emptyFunc() {},

        preventDefault: function preventDefault(evt) {
            evt.preventDefault();
        },

        /** @param {string} msg */
        log: function log(msg) { console.log(msg); },
        /** @param {string} msg */
        error: function error(msg) {
            console.log('Error Occurs: ' + (msg || ''));
            throw new Error(msg);
        },
        assert: function assert(condition, errMsg) {
            if (!condition) {
                $a.error(errMsg || 'adventure.assert Failed.');
            }
        },
        alert: function _alert(msg) { alert(msg); },
        prompt: function _prompt(msg, defaultValue) { return prompt(msg, defaultValue); },

        body: function documentBody() {return $(document.body); },

        pageContainer: function getPageContainer() {
            // **Get page container jQuery node.
            return $.id('PageContainer');
        },

        /**
         * Show or hide page curtain. (default show)
         * Curtain node is a div as root child of page container covering whole container to prevent other user action.
         * @param {boolean} show
         */
        showCurtain: function showCurtain(show) {
            var curtainId = 'Curtain',
                curtain = $.id(curtainId);
            if (curtain.isEmpty()) {
                curtain = $(document.createElement('div')).attr('id', curtainId);
                this.body().append(curtain);
            }

            if (show === false) {
                curtain.css('display', 'none');
            } else {
                curtain.css({'display': 'block', 'z-index': $a.frontZIndex('#' + curtainId)});
            }
        },

        /**
         * Mask whole page and show state that indicates page is loading contents, or hide. (default show)
         * @param {boolean} show
         */
        showLoading: function showLoading(show) {
            var loadingId = 'Loading',
                loading = $.id(loadingId);
            if (loading.isEmpty()) {
                loading = $(document.createElement('div')).attr('id', loadingId);
                this.body().append(loading);
                var loadingIndicator = $(document.createElement('div')).text('Loading ......');
                loading.append(loadingIndicator);
                loadingIndicator.center(loading);
            }
            if (show === false) {
                loading.css('display', 'none');
            } else {
                loading.css({'display': 'block', 'z-index': $a.frontZIndex('#' + loadingId)});
            }
        },

        getHelperById: function getHelperById(helperId) {
            var helper = $a.helpers[helperId];
            $a.assert(helper, 'adventure.getHelperById: No helper with id: ' + helperId);
            return helper;
        },

        getHelperByNode: function getHelperByNode(jNode, searchForParent) {
            var jqHelperNode = searchForParent ? $(jNode).closest(helperIdAttrSelector) : $(jNode),
                helperId = jqHelperNode.attr(helperIdStr);
            return helperId ? $a.helpers[helperId] : null;
        },

        /**
         * Create helper for dom node.
         * Helper id is specified (as 'hid' in props), OR node id or auto-generated prefixed with node attr helperIdPrefix;
         * Helper class is specified in node attr 'helperClass'; Constructor param is dom node.
         * NOTE this function is asynchronous
         * @param {HTMLElement} node
         * @param {Object} [props] Properties that will be mixed into helper
         * @param {Function} [callbackFn]
         */
        asyncNewHelper: function asyncNewHelper(node, props, callbackFn) {
            var jqNode = $(node),
                helpers = $a.helpers;
            require(['$a/' + jqNode.attr('helperClass')], function (HelperClass) {
                props = props || {};
                props.hid = props.hid || ((jqNode.attr('helperIdPrefix') || '') + (jqNode.attr('id') || getNextAutoHelperId()));
                var helperId = props.hid;
                $a.assert(helpers[helperId] === undefined, 'adventure.asyncNewHelper: Duplicate helper ID: ' + helperId);
                helpers[helperId] = new HelperClass(node, props);
                jqNode.attr(helperIdStr, helperId);

                if (callbackFn) {
                    callbackFn();
                }
            });
        },

        /**
         * Search node starting from base node, create helpers for node if needed
         * Could be suppressed by node attribute "suppressAutoCreate"
         */
        autoAsyncCreateHelpers: function autoAsyncCreateHelpers(jBaseNode) {
            var helperNodes = $(jBaseNode).rfind('[helperClass]').not('[suppressAutoCreate]').nodes(),
                requiredClasses = helperNodes.map(function (node) {
                    return '$a/' + $(node).attr('helperClass');
                });
            require.apply(null, [ requiredClasses, function () {
                helperNodes.forEach(function (node) {
                    // 所需类已预加载，此处调用实际是同步调用
                    $a.asyncNewHelper(node);
                });
            } ]);
        },

        /** @param {string} hid */
        removeHelper: function removeHelper(hid) {
            $($a.helpers[hid].node).removeAttr(helperIdStr);
            return delete $a.helpers[hid];
        },

        /** 获取当前body下的新的最大z-index值以使设置该值的元素显示在最前端 */
        frontZIndex: function frontZIndex(excludeSelector) {
            var zIndices = this.body().children().not(excludeSelector).nodes().map(function (node) {
                return parseInt($(node).css('z-index'), 10) || 0;
            });
            return Math.max.apply(null, [ 0 ].concat(zIndices)) + 1;
        },

        isEqual: function isEqual(a, b) {
            // **Check whether two items have the same value.
            // **NOTE: For object and array, only iterate on 1-depth level to compare whether inner properties is the same.
            // **      So if object has property that's still object, only compare child object's reference.
            // **      For Array, only check value on index.
            if ((typeof a !== typeof b) || $math.xor(a instanceof Array, b instanceof Array)) {
                // Not same type.
                return false;
            } else if (typeof a !== 'object'/*not object*/ || /*null*/(!a || !b)) {
                return a === b;
            } else {
                if (Object.getOwnPropertyNames(a).length !== Object.getOwnPropertyNames(b).length) {
                    return false;
                }
                var result = true;
                $.each(a, function (nameOrIdx) {
                    if (a[nameOrIdx] !== b[nameOrIdx]) {
                        result = false;
                        return false;
                    }
                });
                return result;
            }
        },

        isString: function isString(input) {
            return typeof input === 'string';
        },

        /**
         *
         * Check whether input is a string and not empty.
         * @param {string} str
         * @returns {boolean}
         */
        isNoEmptyString: function (str) {
            return (typeof str === 'string') && str !== '';
        },

        /**
         * Submit JSON data to server through form. Server will receive json data string under form property 'json'.
         * Not to use ajax as it won't replace current page to new page.
         * @param {string} uri
         * @param {Object | string} json JSON object, or JSON string
         */
        submitJSONByForm: function submitJSONByForm(uri, json) {
            // **Submit JSON data to server through form. Server will receive json data string under form property 'json'.
            // **Not to use ajax as it won't replace current page to new page.
            var hiddenForm = $(document.createElement('form')).css('display', 'none').attr({'action': uri, 'method': 'POST'}),
                input = $(document.createElement('input')).attr({'name': 'json', 'value': (typeof json === 'string') ? json : JSON.stringify(json)});
            hiddenForm.append(input);
            $('body').append(hiddenForm);
            hiddenForm[0].submit();
        },

        /**
         * Submit request through form.
         * Different from submitJSONByForm, this func will create a form property for each key in params.
         * @param {string} uri Target uri that request will be sent to
         * @param {Object} params Form name/value pair, assuming there's no reference value such as object
         */
        submitForm: function submitForm(uri, params) {
            var hiddenForm = $(document.createElement('form')).css('display', 'none').attr({'action': uri, 'method': 'POST'});
            $.each(params, function (key, val) {
                hiddenForm.append($(document.createElement('input')).attr({'name': key, 'value': val}));
            });
            $('body').append(hiddenForm);
            hiddenForm[0].submit();
        },

        redirect: function redirect(url) {
            location.href = url;
        },

        /**
         * Get first query string value of given name.
         * @param {string} paramName
         * @returns {string | undefined}
         */
        queryString: function queryString(paramName) {
            var queryStr = location.search,
                startIdx = queryStr.search(new RegExp('[?&]' + paramName + '='));
            if (startIdx === -1) {
                return undefined;       // Return undefined indicating it doesn't exist rather than is empty string ''.
            } else {
                var rightPartString = queryStr.slice(startIdx + 1),
                    endIdx = rightPartString.indexOf('&'),
                    specifiedQueryString = (endIdx === -1) ? rightPartString : rightPartString.slice(0, endIdx);
                return specifiedQueryString.split('=')[1];
            }
        },

        /**
         * Send jQuery ajax with POST method default, and show loading when request
         * Default send 'POST' request, and throw error if fail
         */
        ajaxWithLoading: function ajaxWithCommonProps(settings) {
            if (!settings.type) {
                settings.type = 'POST';
            }
            // 同步请求将不支持Defered(使用.done(), .fail())，因而设置ajax settings
            var fnComplete = settings.complete,
                fnError = settings.error;
            settings.complete = function () {
                $a.showLoading(false);
                if (fnComplete) {
                    fnComplete.apply(this, arguments);
                }
            };
            settings.error = function () {
                $a.error('Ajax loading failed.');
                if (fnError) {
                    fnError.apply(this, arguments);
                }
            };
            $a.showLoading(true);
            return $.ajax(settings);
        }
    };

    return window.$a;
});