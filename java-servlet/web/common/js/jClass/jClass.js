define(function () {
    var P_SUPER = 'Super',
        P_CONSTRUCTOR = 'constr',
        P_CLASS = 'Class',
        P_SUPER_SEARCH_CHAIN = '_superSearchChain',
        P_SUPER_FNS = '_superFns',
        P_CLASS_NAME = '_className',
        P_IS_WRAPPER_OF_ANY = '_isWrapperOfAny',
        P_TEMPLATE_CONFIG = 'templateConfig',
        V_IDENTIFIER_ANY = '*';

    function ensureArray(input) { return input instanceof Array ? input : [ input ]; }

    function arrEach(arr, fnCallback) {
        for (var i = 0; i < arr.length; i++) {
            if (fnCallback(arr[i], i) === false) { return; }
        }
    }

    function objEach(obj, fnCallback) {
        for (var key in obj) { fnCallback(key, obj[key]); }
    }

    function combineFuncs(fnA, fnB) {
        return function combinedFunc() {
            fnA.apply(this, arguments);
            fnB.apply(this, arguments);
        };
    }

    var uniqueCounter = 0;
    function getUniqueName() {
        return 'jClass_' + (++uniqueCounter);
    }

    function wrapFnForIdentifierAny(fn) {
        var wrapperFn = function wrapperFnForAny() {
            fn.apply(this, arguments);
        };
        wrapperFn[P_IS_WRAPPER_OF_ANY] = true;
    }

    function callSuper() {
        var upperFn = callSuper.caller,
            srcFn = upperFn.caller && upperFn.caller[P_IS_WRAPPER_OF_ANY] ? upperFn.caller : upperFn,
            superFns = srcFn[P_SUPER_FNS],
            superFn;
        if (superFns) {
            arrEach(this[P_SUPER_SEARCH_CHAIN] || [V_IDENTIFIER_ANY]/**for no-class object*/, function (identifier) {
                if (superFns[identifier]) {
                    superFn = superFns[identifier];
                    return false;
                }
            });
        }

        if (superFn) { return superFn.apply(this, arguments); }
    }

    function copy(src, dest) {
        objEach(src, function (key, val) { dest[key] = val; });
        return dest;
    }

    /**
     * @param {Object || Array.<Object>} src
     * @param {Object} target
     */
    function mixin(src, target) {
        if (!target[P_SUPER]) {
            target[P_SUPER] = callSuper;
        }
        var identifier = target.hasOwnProperty(P_CLASS_NAME) ? target[P_CLASS_NAME] : V_IDENTIFIER_ANY;
        arrEach(ensureArray(src), function (srcMixin) {
            objEach(srcMixin, function (key, val) {
                if (key === P_TEMPLATE_CONFIG) {
                    val = copy(val, target[key] ? Object.create(target[key]) : {});
                } else if (typeof val === 'function' && typeof target[key] === 'function') {
                    if (key === P_CONSTRUCTOR) {
                        val = combineFuncs(target[key], val);
                    } else {
                        if (identifier === V_IDENTIFIER_ANY) {
                            val = wrapFnForIdentifierAny(val);
                        }
                        var superFns = val[P_SUPER_FNS] = val[P_SUPER_FNS] || {};
                        superFns[identifier] = target[key];
                    }
                }
                target[key] = val;
            })
        });
        return target;
    }

    return {
        declare: function declare(SuperClass, mixins, classProps) {
            var newClassName = getUniqueName(),
                superProto = SuperClass && SuperClass.prototype,
                proto = superProto ? Object.create(superProto) : {};
            proto[P_CLASS_NAME] = newClassName;
            proto[P_SUPER_SEARCH_CHAIN] = [V_IDENTIFIER_ANY, newClassName].concat((superProto && superProto[P_SUPER_SEARCH_CHAIN] || []).slice(1));
            mixin((mixins || []).concat([classProps] || []), proto);
            function CONSTR() {
                if (this['_pre' + P_CONSTRUCTOR]) { this['_pre' + P_CONSTRUCTOR].apply(this, arguments); }
                if (this[P_CONSTRUCTOR]) { this[P_CONSTRUCTOR].apply(this, arguments); }
            }
            CONSTR.prototype = proto;
            proto[P_CLASS] = proto.constructor  = CONSTR;
            return CONSTR;
        },

        mixin: mixin
    };
});