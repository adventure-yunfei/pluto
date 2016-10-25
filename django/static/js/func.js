define(function () {
    if (!Function.prototype.bind) {
        Function.prototype.bind = function bind(context) {
            var func = this;
            return function func_bindedThis() {
                func.apply(context, arguments);
            };
        };
    }

    return {
        composite: function (funcs) {
            return function () {
                var args = arguments,
                    me = this;
                $.each(funcs, function (idx, f) {
                    f.apply(me, args);
                });
            };
        }
    };
});