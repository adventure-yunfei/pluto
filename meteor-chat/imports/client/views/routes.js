import React from 'react';
import { Route, IndexRoute } from 'react-router';
import ChattingPage from './chatting-page/ChattingPage';

export default (
    <Route path="/">
        <IndexRoute component={ChattingPage}/>
    </Route>
)
