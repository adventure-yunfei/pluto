import immutable from 'immutable';
import pick from 'lodash/pick';

import createAction from 'yfjs/lib/redux-utils/createAction';
import setActionToString from 'yfjs/lib/redux-utils/setActionToString';
import {post} from '../../../../lib/request';

export function initEditPhotographyData({request, location, params}) {
    const title = encodeURIComponent(params.photographyTitle);
    return {
        type: initEditPhotographyData,
        payload: request({url: `/api/photo/photography/${title}/edit`}).then(({data}) => immutable.fromJS(data))
    };
}

export function initCreatePhotographyData() {
    return createAction(initCreatePhotographyData);
}

export function setData(prop, value) {
    return {
        type: setData,
        payload: {prop, value}
    };
}

export function save(photographyEditorData) {
    return createAction(
        save,
        post('/api/photo/save', pick(photographyEditorData.toJS(), ['id', 'title', 'content']))
    );
}

setActionToString('photographyEditor', {
    initEditPhotographyData,
    initCreatePhotographyData,
    setData,
    save
});
