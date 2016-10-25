import immutable from 'immutable';

import reducer from './reducers';
import {configureStore} from './redux-utils';

export default function configurePhotoStore(initialState) {
    const store = configureStore(reducer, immutable.fromJS(initialState || {}));

    // Hot reload reducers
    if (module.hot) {
        module.hot.accept('./reducers', () =>
            store.replaceReducer(require('./reducers'))
        );
    }

    return store;
}
