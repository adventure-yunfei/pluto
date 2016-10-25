import React from 'react';
import {render} from 'react-dom';
import {Router, browserHistory} from 'react-router';
import {Provider} from 'react-redux';

import '../lib/polyfill';

import createRoutes from './createRoutes';
import configureStore from './configureStore';

const store = configureStore(window.__INITIAL_STATE__);
const routes = createRoutes(store.getState);

__TEST__ && (window.store = store);

// 百度统计
browserHistory.listen(location => {
    window._hmt.push(['_trackPageview', location.pathname]);
});

render((
    <Provider store={store}>
        <Router history={browserHistory} routes={routes}/>
    </Provider>
), document.getElementById('app'));
