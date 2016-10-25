define(['$a', '$a/BaseHelper', '$a/photo/_CanUploadImage', 'jClass'], function ($a, BaseHelper, _CanUploadImage, jClass) {
    return jClass.declare(BaseHelper, [ _CanUploadImage ], {
        /** @param {HTMLElement} node */
        $constructor: function constructor(node, props) {
            this.$super(node, props);
            this.node = node;
            // Get photography id from url.
            var url = location.href;
            this.photographyId = (/edit$/.test(url)) ? null : parseInt(url.match(/edit\/(\d+$)/)[1], 10);
            this.images = {};   // Used images info containing both origin and normalized images, with format {filename : imgPath}.

            this.on('#Edit_UploadImage', 'change', this.uploadImage);
            this.on('#Edit_UplaodNormalizedImage', 'change', this.uploadImage);
        },

        uploadImageSuccessCallback: function updateUploadedImagesInfo(data, textStatus, jqXHR) {
            // **Update uploaded images info when successful upload new images, and also update rendering in page.
            // **@param newUploadedImages: Object indicating uploaded images' name and url link, with format [{'name':filename, 'path':imagePath}].
            var me = this,
                images = me.images,
                newUploadedImages = JSON.parse(jqXHR.responseText);
            $.each(newUploadedImages, function (index, imgInfo) {
                var name = imgInfo.name;
                if (!images[name]) {   // A new image instead of update or supplement, should add into photography content.
                    var editContent = $(me.node).find('#Edit_Content');
                    editContent.val(editContent.val() + '\n{% image "' + name + '" %}');
                }
                images[name] = imgInfo.path;
            });
        }
    });
});
