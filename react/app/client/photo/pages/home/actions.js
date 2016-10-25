import immutable from 'immutable';
import omit from 'lodash/omit';
import isEqual from 'lodash/isEqual';
import find from 'lodash/find';
import __assert__ from 'js-assert/__assert__';

import setActionToString from 'yfjs/lib/redux-utils/setActionToString';
import {post} from '../../../../lib/request';

// 初始化数据
export function initSections({request, location, params}) {
    return {
        type: initSections,
        payload: request({url: '/api/photo/get_sections'}).then(({data}) => {
            return immutable.fromJS(data.sections);
        })
    };
}

/**@param {immutable.List} oldSections
 * @param {immutable.List} newSections */
export function saveChanges(oldSections, newSections) {
    const getSectionsAndEntriesInfo = sections => {
        return sections.toJS().reduce((res, {id, _id, name, entries}, idx) => {
            res.sections.push({
                id,
                tmp_new_id: id ? undefined : _id,
                name,
                order: idx + 1
            });
            res.entries = res.entries.concat(entries.map(entry => ({
                ...entry,
                section_id: _id
            })));
            return res;
        }, {sections: [], entries: []});
    };
    const getChanges = (oldData, newData) => {
        var changes = {
            insert: [], // Contains props (except id)
            update: [], // Contains all props
            remove: [] // Contains only id prop
        };
        newData.forEach(newOne => {
            if (!newOne.id) {
                changes.insert.push(newOne);
            } else {
                const oldOne = find(oldData, d => d.id === newOne.id);
                __assert__(!!oldOne, `新的 section.id (${newOne.id}) 不存在于已有 section 列表中`);
                if (!isEqual(oldOne, newOne)) {
                    changes.update.push(omit(newOne, ['tmp_new_id']));
                }
            }
        });

        changes.remove = oldData.reduce((result, oldOne) => {
            __assert__(!!oldOne.id, '已有 section 必须有 id 属性');
            if (newData.every(d => d.id !== oldOne.id)) {
                result.push(oldOne.id);
            }
            return result;
        }, []);

        return changes;
    };
    const oldInfo = getSectionsAndEntriesInfo(oldSections),
        newInfo = getSectionsAndEntriesInfo(newSections);


    return {
        type: saveChanges,
        payload: post('/api/photo/apply_section_and_entry_changes', {
            sectionChanges: getChanges(oldInfo.sections, newInfo.sections),
            entryChanges: getChanges(oldInfo.entries, newInfo.entries)
        })
    };
}

export function setSections(sections) {
    return {type: setSections, payload: sections};
}

setActionToString('home', {
    initSections,
    setSections,
    saveChanges
});
