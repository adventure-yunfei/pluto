import immutable from 'immutable';

import createReducer from 'yfjs/lib/redux-utils/createReducer';
import * as actions from './actions';

export default createReducer(new Map([
    [actions.initEditPhotographyData, (state, data) => data],

    [actions.initCreatePhotographyData, () => immutable.fromJS({})],

    [actions.setData, (state, {prop, value}) => state.set(prop, value)]
]));
