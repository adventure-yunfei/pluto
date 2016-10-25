import immutable from 'immutable';

import combineImmutableReducers from 'yfjs/lib/redux-utils/combineImmutableReducers';
import {clearState} from './components/clear-states/actions';

// 加载所有reducer
// photo reducers
import home from './photo/pages/home/reducer';
import photography from './photo/pages/photography/reducer';
import photographyEditor from './photo/pages/publish-photography/reducer';
// game 2048 reducers
import {reducer as game2048} from './game2048';

const defaultUserState = immutable.fromJS({
    isLoggedIn: false
});
function user(state = defaultUserState, action) {
    return state;
}

function pendingActions(state = immutable.fromJS({}), {type, payload}) {
    switch (type) {
        case '@ACTION_START':
            return state.set(payload.toString(), true);
        case '@ACTION_END':
            return state.delete(payload.toString());
        default:
            return state;
    }
}

export default combineImmutableReducers({
    user,
    pendingActions,

    // photo
    home,
    photography,
    photographyEditor,

    // game2048
    game2048

}, (state, {type, payload}) => {
    switch (type) {
        case clearState:
            return payload.reduce((state, clearStatePath) => {
                return state.setIn(clearStatePath.split('.'), null);
            }, state);
        default:
            return state;
    }
});
