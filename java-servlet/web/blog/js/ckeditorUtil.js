define(['cm/jQueryEx', 'cm/utils/util', 'ckeditor'], function ($, util) {
    return {
        delayGetDisplayDocHtml: function delayGetDisplayDocHtml(ckeditorData) {
            var deferred = $.Deferred(),
                id = util.uniqueId();
            $('<div>').appendTo(document.body)
                .attr('id', id);
            CKEDITOR.replace(id, {
                on: {
                    instanceReady: function () {
                        var docHtml = this.document.$.documentElement.innerHTML;
                        this.element.remove();
                        this.destroy();
                        deferred.resolveWith(null, docHtml);
                    }
                }
            });
            CKEDITOR.instances[id].setData(ckeditorData);

            return deferred.promise();
        }
    };
});