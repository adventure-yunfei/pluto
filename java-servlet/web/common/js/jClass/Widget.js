define(['jClass/jClass', 'jClass/NotifiableObj', 'jClass/_HasTemplate'], function (jClass, NotifiableObj, _HasTemplate) {
    return jClass.declare(
        NotifiableObj,

        [ _HasTemplate ],

        {
            cssClass: '',

            visible: true,

            _visible2display: function _visible2display() {
                return this.visible ? 'block' : 'none';
            },

            templateConfig: {
                html: '<div class="{{cssClass}}" jc-bind-style-display="visible:_visible2display">{{> content}}</div>'
            }
        }
    );
});