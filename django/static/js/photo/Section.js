define(['$a', '$a/BaseHelper', '$a/template', '$a/photo/EditEntries', '$a/photo/editUtils', 'jClass'],
function ($a, BaseHelper, template, EditEntries, EditUtils, jClass) {
    /**@class Section */
    return jClass.declare(BaseHelper, null, {
        $constructor: function constructor(node, props) {
            this.$super(node, props);
            this.contentNode = this.find('.Section_Entries')[0];

            this.on('.Section_Title .RemoveSection', 'click', this.removeSection);
            this.on('.Section_Title .EditEntries',   'click', this.editEntries);
        },

        /** onclick 函数，响应 'Remove Section' 图片，移出此section */
        removeSection: function removeSection() {
            var jqNode = $(this.node);
            $a.removeHelper(this.hid);
            jqNode.remove();
        },

        /** onclick 函数，响应 'Edit Entries' 节点，打开编辑界面 */
        editEntries: function editEntries() {
            EditEntries.openEditEntriesInterface(this);
        },

        addEntries: function addEntries(entryInfos) {
            var me = this;
            template.ensureTemplatesExist(['photo/_entry.html'], function (tpl) {
                $.each(entryInfos, function (idx, entry) {
                    var newEntryNode = $(template.fillTemplate(tpl, {
                        id: entry.id || EditUtils.getNextNewId(),
                        sectionId: me.getSectionId(),
                        title: entry.title,
                        thumbnail_image_src: entry.thumbnail,
                        target_link: entry.target
                    }))[0];
                    me.find('.Section_Entries').append(newEntryNode);
                });
            }, {sync: true});
        },

        editEntry: function editEntry(entryNode) {
            var title = $a.prompt('请输入项目标题：', this.entryTitle(entryNode)),
                thumbnail = $a.prompt('请输入项目缩略图链接：', this.entryThumbnail(entryNode)),
                target = $a.prompt('请输入项目目标链接：', this.entryTarget(entryNode));
            if (title !== null) {
                this.entryTitle(entryNode, title);
            }
            if (thumbnail !== null) {
                this.entryThumbnail(entryNode, thumbnail);
            }
            if (target !== null) {
                this.entryTarget(entryNode, target);
            }
        },

        getSectionId: function getSectionId() {
            return $(this.node).attr('sectionId');
        },

        /** Get/Set "title" of this section */
        sectionTitle: function sectionTitle(newTitle) {
            var jqTitle = $(this.node).find('.Section_Title > span');
            return newTitle === undefined ? jqTitle.trimText() : jqTitle.text(newTitle);
        },

        /**
         * Get entries info under this section
         * @returns {Array.<{}>}
         */
        getEntriesInfo: function getEntriesInfo() {
            var me = this,
                entries = [];
            $(this.node).find('.Entry').each(function (entryIdx, entryNode) {
                entries.push({
                    id: me.getEntryId(entryNode),
                    sectionId: me.getSectionId(),
                    order: entryIdx + 1,
                    title: me.entryTitle(entryNode),
                    thumbnail: me.entryThumbnail(entryNode),
                    target: me.entryTarget(entryNode)
                });
            });
            return entries;
        },

        getEntryId: function getEntryId(jEntryNode) {
            return $(jEntryNode).attr('entryId');
        },

        /**
         * Get/Set "title" of entry
         * @param [HTMLElement | jQuery} jEntryNode
         * @param {*} [newTitle] If provided, set value; Otherwise get value
         */
        entryTitle: function getOrSetEntryTitle(jEntryNode, newTitle) {
            var jqTitle = $(jEntryNode).find('.Entry_Title > a');
            return newTitle === undefined ? jqTitle.trimText() : jqTitle.text(newTitle);
        },

        /**
         * Get/Set "thumbnail" of entry
         * @param [HTMLElement | jQuery} jEntryNode
         * @param {*} [newThumbnail] If provided, set value; Otherwise get value
         */
        entryThumbnail: function getOrSetEntryThumbnail(jEntryNode, newThumbnail) {
            var jqThumbnail = $(jEntryNode).find('.Entry_Thumbnail');
            return newThumbnail === undefined ? jqThumbnail.attr('src') : jqThumbnail.attr('src', newThumbnail);
        },

        /**
         * Get/Set "target" of entry
         * @param [HTMLElement | jQuery} jEntryNode
         * @param {*} [newTarget] If provided, set value; Otherwise get value
         */
        entryTarget: function getOrSetEntryTarget(jEntryNode, newTarget) {
            var jqTarget = $(jEntryNode).find('a');
            return newTarget === undefined ? jqTarget.attr('href') : jqTarget.attr('href', newTarget);
        }
    });
});
