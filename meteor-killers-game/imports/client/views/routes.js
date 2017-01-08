import React from 'react';
import { Route, IndexRoute } from 'react-router';
import HomePage from './HomePage';
import RoomPage from './RoomPage';

export default (
    <Route path="/">
        <IndexRoute component={HomePage}/>
        <Route path="room/:roomId" component={RoomPage}/>
    </Route>
)