define(['jquery'], function ($) {
    return {
        constr: function constr() {
            this._$ = $(this);
        },

        on: function on(events, handler, context) {
            if (!handler._wrapperFn) {
                handler._wrapperFn = function handlerWrapper(jqEvent, extraParams) {
                    handler.call(context || null, extraParams);
                };
            }
            this._$.on(events, handler._wrapperFn);
        },

        off: function off(events, handler) {
            if (handler) {
                this._$.off(events, handler._wrapperFn);
            } else {
                this._$.off(events);
            }
        },

        trigger: function trigger(eventConfig) {
            this._$.trigger(eventConfig.type, eventConfig);
        },

        set: function set(name, value) {
            var oldVal = this[name];
            this[name] = value;
            if (value !== oldVal) {
                this.trigger(this.getPropChangeEvent(name, value, oldVal));
            }
        },

        getPropChangeEvent: function getPropChangeEvent(propName, newValue, oldValue) {
            return {
                type: propName + 'Change',
                value: newValue,
                valueWas: oldValue
            };
        }
    }
});