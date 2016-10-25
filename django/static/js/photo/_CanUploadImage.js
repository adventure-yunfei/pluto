define(['$a'], function ($a) {
    function fnFileUploadClickPass(evt) {
        var fileInput = $(evt.currentTarget).closest('.FileUpload').find('input[type="file"]');
        $a.log(fileInput.length);
        fileInput.trigger('click');
    }
    return {
        /** Whether to allow overwrite existed image with the same name when upload image */
        allowImageOverwrite: false,

        /** Css Selector to find the checkbox node that bind its value to allowImageOverwrite */
        allowImageOverwriteNodeSelector: '.allowImageOverwrite',

        /**
         * Init allowImageOverwrite node onchange event to bind the checkbox value to allowImageOverwrite
         * @param {HTMLElement} node Dom node that this helper will be applied to
         */
        $constructor: function constructor(node) {
            this.$super.apply(this, arguments);
            var jqOverwriteNode = $(node).find('.allowImageOverwrite');
            this.allowImageOverwrite = jqOverwriteNode.prop('checked');
            this.on('.allowImageOverwrite', 'change', function () {
                this.allowImageOverwrite = jqOverwriteNode.prop('checked');
            });
        },

        initEventBinding: function initEventBinding(jRootNode) {
            this.$super.apply(this, arguments);
            this.on('.FileUpload > .FileUpload_Picker', 'click', fnFileUploadClickPass, null, jRootNode);
        },

        /**
         * Upload image, should be binded to onchange event of files <input> (support multiple), to upload image immediately after files are selected
         */
        uploadImage: function uploadImage(e) {
            var formData = new FormData();
            if (this.allowImageOverwrite) {
                formData.append('allowOverwrite', 'allowOverwrite');
            }
            if (e.target.files.length === 0) {
                return;
            }
            $.each(e.target.files, function () {
                formData.append('images', this);
            });

            var jqXHR = $a.ajaxWithLoading({
                    url: '/uploadImage',
                    data: formData,
                    processData: false,
                    contentType: false
                }).done(this.uploadImageSuccessCallback.bind(this))
                    .fail(this.uploadImageFailureCallback.bind(this))
                    .always(this.uploadImageCompleteCallback.bind(this));
            jqXHR.uploadImageEvent = e;     // Pass the event to callback function through jqXHR
        },

        /** Callback for uploadImage when success. When used, should bind this */
        uploadImageSuccessCallback: $a.emptyFunc,
        /** Callback for uploadImage when failure. When used, should bind this */
        uploadImageFailureCallback: $a.emptyFunc,
        /** Callback for uploadImage when complete. When used, should bind this */
        uploadImageCompleteCallback: $a.emptyFunc
    };
});
