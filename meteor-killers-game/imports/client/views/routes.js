import React from 'react';
import { Route, IndexRoute } from 'react-router';
import HomePage from './HomePage';
import CreateRoomPage from './CreateRoomPage';
import RoomPage from './RoomPage';

export default (
    <Route path="/">
        <IndexRoute component={HomePage}/>
        <Route path="room">
            <Route path="create" component={CreateRoomPage}/>
            <Route path=":roomId" component={RoomPage}/>
        </Route>
    </Route>
)