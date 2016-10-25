define(['jClass/jClass'], function (jClass) {
    return jClass.declare(null, null, {
        _preconstr: function _preconstr(props) {
            jClass.mixin(props, this);
        }
    });
});