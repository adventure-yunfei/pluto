define(['$a', '$a/template', '$a/BaseHelper', '$a/photo/_CanUploadImage', '$a/array', '$a/photo/editUtils', 'jClass'],
function ($a, template, BaseHelper, _CanUploadImage, array, EditUtils, jClass) {
    /**@param {Array.<{}>} entriesInfo 从Section helper中获取的entries列表信息 {@see Section.getEntriesInfo()}
     * @private */
    function addEntries(entriesInfo) {
        template.ensureTemplatesExist(['photo/_editEntries_entry.html'], function (tpl) {
            var entriesHTML = '';
            $.each(entriesInfo, function (idx, entry) {
                entriesHTML += template.fillTemplate(tpl, {
                    id: entry.id,
                    title: entry.title,
                    thumbnail_image_src: entry.thumbnail,
                    target_link: entry.target
                });
            });

            var jqEntriesNode = $(entriesHTML);
            jqEntriesNode.appendTo(this.contentNode);
            this.initEventBinding(jqEntriesNode);
        }, {sync: true, ctxt: this});
    }

    var EditEntries = jClass.declare(BaseHelper, [ _CanUploadImage ], {
            /**@type Section*/
            openerSection: null,

        $constructor: function constructor(node, props) {
                this.$super(node, props);
                this.contentNode = this.find('#EditEntries_List')[0];
                this.originEntries = this.getEntryList();

                this.find('#EditEntries_List').sortable({
                    axis: 'y'
                });
            },

            initEventBinding: function initEventBinding(jRootNode) {
                this.$super.apply(this, arguments);
                this.on('#EditEntries_OK',     'click', this.OK, null, jRootNode);
                this.on('#EditEntries_Cancel', 'click', this.Cancel, null, jRootNode);
                this.on('#EditEntries_Add',    'click', this.addEmptyEntry, null, jRootNode);
                this.on('.EditEntry_Remove',   'click', this.removeEntry, null, jRootNode);
                this.on('.EditEntry_UploadThumbnail', 'change', this.uploadImage, null, jRootNode);
            },

            uploadImageSuccessCallback: function uploadImageSuccessCallback(data, textStatus, jqXHR) {
                var imgInfos = JSON.parse(jqXHR.responseText);
                $a.assert(imgInfos.length === 1, 'EditEntries.p.uploadThumbnail: Returned saved images info\'s length (' + imgInfos.length + ') should be exactly 1.!');
                $(jqXHR.uploadImageEvent.target).closest('.EditEntry').find('[name="thumbnail"]').val(imgInfos[0].path);
            },

            getEntryList: function getEntryList() {
                // **Get entry info list (order by dom node order), excluding entry with empty info.
                return $.map($('.EditEntry'), function (entryNode) {
                    /** @type {{id:*, title:*, thumbnail:*, target:*}} */
                    var entryInfo = $(entryNode).children().serializeJSONObject();
                    return (!!entryInfo.title || !!entryInfo.thumbnail || !!entryInfo.target) ? entryInfo : null;
                });
            },

            closeInterface: function closeInterface() {
                // **Close edit entries interface and remove relative dom node and helper.
                $.id(EditEntries.id).remove();
                $a.removeHelper(EditEntries.id);
                $a.showCurtain(false);
            },

            /** onclick func for 'Add Entry' img node to add an entry
             * @async */
            addEmptyEntry: function addEmptyEntry() {
                template.ensureTemplatesExist(['photo/_editEntries_entry.html'], function (tpl) {
                    var jqEntryNode = $(template.fillTemplate(tpl, {
                        id: EditUtils.getNextNewId()
                    }));
                    jqEntryNode.appendTo(this.contentNode);
                    this.initEventBinding(jqEntryNode);
                }, {ctxt: this});
            },

            /** onclick func for 'Remove Entry' img node to remove an entry */
            removeEntry: function removeEntry(e) {
                // Is only one entry left? Then should clone and empty one before remove it.
                if ($(this.node).find('.EditEntry').length === 1) {
                    this.addEmptyEntry();
                }
                $(e.currentTarget).closest('.EditEntry').remove();
            },

            OK: function OK() {
                var section = this.openerSection,
                    currentEntries = this.getEntryList(),
                    changes = EditUtils.getChanges(this.originEntries, currentEntries);
                template.ensureTemplatesExist(['photo/_entry.html'], function () {
                    this.closeInterface();

                    function fnGetEntry(entryId) {
                        var jqEntryNode = section.find('.Entry[entryId="' + entryId + '"]');
                        $a.assert(jqEntryNode.onlyOne(), 'EditEntries.OK: Entry with id:' + entryId + ' should appear only once.');
                        return jqEntryNode;
                    }
                    // Insert entries
                    section.addEntries(changes.insert);

                    // Update entries
                    $.each(changes.update, function (idx, updatedEntry) {
                        var jqEntryNode = fnGetEntry(updatedEntry.id);
                        section.entryTitle(jqEntryNode, updatedEntry.title);
                        section.entryThumbnail(jqEntryNode, updatedEntry.thumbnail);
                        section.entryTarget(jqEntryNode, updatedEntry.target);
                    });

                    // Remove entries
                    $.each(changes.remove, function (idx, removedEntryId) {
                        fnGetEntry(removedEntryId).remove();
                    });

                    // Reorder entries
                    $.each(currentEntries, function (idx, entry) {
                        fnGetEntry(entry.id).appendTo(section.contentNode);
                    });
                }, {ctxt: this});
            },

            Cancel: function Cancel() {
                // **onclick func for Cancel button.
                this.closeInterface();
            }
        });

    EditEntries.id = 'EditEntries';

    /** @param {Section} sectionHelper */
    EditEntries.openEditEntriesInterface = function openEditEntriesInterface(sectionHelper) {
        var eid = EditEntries.id;
        $a.ajaxWithLoading({
            url: '/editEntries',
            data: JSON.stringify({sectionId: sectionHelper.getSectionId()})
        }).done(function (data, textStatus, jqXHR) {
            var jqNode = $($.parseHTML(jqXHR.responseText));
            $a.assert(jqNode.onlyOne() && jqNode.attr('id') === eid, 'EditEntries.openEditEntriesInterface: Invalid ajax html response. Should be a root node with id: ' + eid);
            template.ensureTemplatesExist(['photo/_editEntries_entry.html'], function () {
                $a.showCurtain(true);
                $a.body().append(jqNode.css('z-index', $a.frontZIndex()));
                $a.asyncNewHelper(jqNode[0], {openerSection: sectionHelper}, function () {
                    var editEntries = $a.getHelperByNode(jqNode),
                        entriesInfo = sectionHelper.getEntriesInfo();
                    if (entriesInfo.length) {
                        addEntries.apply(editEntries, [ entriesInfo ]);
                        editEntries.originEntries = editEntries.getEntryList();
                    } else {
                        editEntries.addEmptyEntry();
                    }
                });
            });
        }).fail(function (jqXHR, textStatus, errorThrown) {
            $a.error('Error: EditEntries.onclick.error: Request failed. Status: ' + textStatus + '. Error thrown: ' + errorThrown);
        });
    };

    return EditEntries;
});
