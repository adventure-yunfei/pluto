define(['$a', '$a/BaseHelper', '$a/template', '$a/array', '$a/photo/editUtils', 'jClass'],
function ($a, BaseHelper, template, array, EditUtils, jClass) {
    function checkAndEditEntry(evt) {
        var jqEntry = $(evt.target).closest('.Entry');
        if (jqEntry.isNotEmpty()) {
            var sectionHelper = $a.getHelperByNode(jqEntry, true);
            $a.assert(!!sectionHelper, 'Cannot find Section helper above current double click node.');
            sectionHelper.editEntry(jqEntry[0]);
        }
    }

    var Sections = jClass.declare(BaseHelper, null, {
        /** @type boolean */
        isEditing: false,

        $constructor: function constructor(node, props) {
            this.$super(node, props);
            var me = this;
            this.contentNode = $(node).find('#SectionsList')[0];
            this.on('#ToggleEditing',                   'click', function () {
                me.set('isEditing', !me.isEditing);
            });
            this.on('#AddSection .fi',                  'click', function () {
                me.addSection($(this.node).find('#AddSection input[name="name"]').val());
            });
            this.on('#SaveSectionsChange',              'click', this.saveSectionsChange);
        },

        onisEditingChange: function onisEditingChange() {
            var isEditing = this.isEditing,
                jqNode = $(this.node);
            jqNode.toggleClass('editing', isEditing);
            if (isEditing) {
                // Enable editing.
                jqNode.find('#ToggleEditing').attr('title', "Cancel Editing. This will lose any modification that hasn't saved before.");
                this.makeSortable();
                this.originData = this.getData();
                // Disable click on content node to prevent navigation when click on entry
                // And enable double click on entry to edit
                this.on('#SectionsList', 'click', $a.preventDefault);
                this.on('#SectionsList', 'dblclick', checkAndEditEntry);
            } else {
                // Cancel editing. Refresh page to reset Sections and Entries
                $a.redirect('/');
            }
        },

        /** onclick func for 'Save Sections Change'. */
        saveSectionsChange: function saveSectionsChange() {
            var oldData = this.originData,
                newData = this.getData(),
                sectionChanges = EditUtils.getChanges(oldData.sections, newData.sections),
                entryChanges = EditUtils.getChanges(oldData.entries, newData.entries),
                hasChanges = function (changes) {
                    return changes.insert.length > 0 || changes.update.length > 0 || changes.remove.length > 0;
                };
            if (hasChanges(sectionChanges) || hasChanges(entryChanges)) {
                $a.ajaxWithLoading({
                    url: '/photo/apply_section_and_entry_changes',
                    data: JSON.stringify({
                        sectionChanges: sectionChanges,
                        entryChanges: entryChanges
                    })
                }).then(function () {
                    $a.redirect('/');
                });
            }
        },

        addSection: function addSection(name) {
            template.ensureTemplatesExist(['photo/_section.html'], function (tpl) {
                if (!name) {
                    $a.alert('模块名不能为空！');
                } else if (array.search(this.getData().sections, 'name', name) > -1) {
                    $a.alert('模块名已存在！');
                } else {
                    var jqNewSection = $(template.fillTemplate(tpl, {
                        id: EditUtils.getNextNewId(),
                        name: name
                    }));
                    $a.autoAsyncCreateHelpers(jqNewSection);
                    $(this.contentNode).append(jqNewSection);
                }
            }, {sync: true, ctxt: this});
        },

        makeSortable: function makeSortable() {
            $(this.contentNode).sortable({
                axis: 'y'
            });
            $(this.contentNode).find('.Section_Entries').sortable();
        },

        /**
         * Get current sections and entries information
         * @returns {{sections: Array, entries: Array}}
         */
        getData: function getData() {
            var sections = [],
                entries = [];
            $(this.node).find('.Section').each(function (secIdx, secNode) {
                var sectionHelper = $a.getHelperByNode(secNode);
                sections.push({
                    id: sectionHelper.getSectionId(),
                    name: sectionHelper.sectionTitle(),
                    order: secIdx + 1
                });
                array.insert(entries, sectionHelper.getEntriesInfo());
            });
            return {
                sections: sections,
                entries: entries
            };
        }
    });

    return Sections;
});
