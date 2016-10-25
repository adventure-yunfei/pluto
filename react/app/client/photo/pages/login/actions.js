import createAction from 'yfjs/lib/redux-utils/createAction';
import setActionToString from 'yfjs/lib/redux-utils/setActionToString';
import {postByForm} from '../../../../lib/request';

export const login = (username, password) => createAction(
    login,
    postByForm('/api/login', {
        json: true,
        username,
        password
    })
);

setActionToString('login', {
    login
});
