import immutable from 'immutable';

import createReducer from 'yfjs/lib/redux-utils/createReducer';
import * as actions from './actions';
import {initClientId} from '../../../../lib/utils';

export default createReducer(new Map([
    [actions.initSections, (state, sections) => {
        return state.set('sections', initClientId(sections).map(sec => {
            return sec.update('entries', entries => initClientId(entries));
        }));
    }],

    [actions.setSections, (state, sections) => state.set('sections', sections)]
]), {defaultState: immutable.fromJS({sections: null})});
