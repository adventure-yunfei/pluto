import immutable from 'immutable';

import setActionToString from 'yfjs/lib/redux-utils/setActionToString';

export function initPhotographyData({request, location, params}) {
    return {
        type: initPhotographyData,
        payload: request({url: `/api/photo/photography/${encodeURIComponent(params.photographyTitle)}`})
            .then(({data}) => immutable.fromJS(data))
    };
}

setActionToString('photography', {
    initPhotographyData
});
