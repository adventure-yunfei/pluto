import createAction from 'yfjs/lib/redux-utils/createAction';
import setActionToString from 'yfjs/lib/redux-utils/setActionToString';
import {postByForm} from '../../../../lib/request';

export const logout = () => createAction(
    logout,
    postByForm('/api/logout', {json: true})
);

setActionToString('logout', {
    logout
});
