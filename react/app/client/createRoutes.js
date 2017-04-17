import React from 'react';
import {Route, IndexRoute, IndexRedirect} from 'react-router';
import urlEncoder from 'urlencoder';

import Root from './components/Root';

// photo pages
import PageContainer from './photo/pages/page-container/PageContainer';
import Home from './photo/pages/home/Home';
import About from './photo/pages/about/About';
import Photography from './photo/pages/photography/Photography';
import {CreatePhotography, EditPhotography} from './photo/pages/publish-photography/PublishPhotography';
import Login from './photo/pages/login/Login';
import Logout from './photo/pages/logout/Logout';

// game 2048 pages
import {Game2048} from './game2048';


export default function createRoutes(getState) {
    const requireAuth = (nextState, replaceState) => {
        const isLoggedIn = getState().getIn(['user', 'isLoggedIn']);
        if (!isLoggedIn) {
            const {location} = nextState;
            const originURL = location.pathname + location.search;
            return replaceState(`/login?originURL=${urlEncoder.encode(originURL)}`);
        }
    };

    return (
        <Route path="/" component={Root}>
            <Route path="2048" component={Game2048}/>
            <Route component={PageContainer}>
                <IndexRoute component={Home}/>
                <Route path="about" component={About}/>
                <Route path="login" component={Login}/>
                <Route path="logout" component={Logout}/>
                <Route path="photography">
                    <Route path="create" component={CreatePhotography} onEnter={requireAuth}/>
                    <Route path=":photographyTitle">
                        <IndexRoute component={Photography}/>
                        <Route path="edit" component={EditPhotography} onEnter={requireAuth}/>
                    </Route>
                </Route>
            </Route>
        </Route>
    );
}
